-- Internal functions are called only by privileged RPCs, with a fixed search_path.
create function can_fit(p_id uuid,p_start timestamptz,p_end timestamptz,p_exclude uuid default null) returns boolean language sql stable set search_path=public as $$
 select p_end>p_start and exists(select 1 from working_hours w where w.professional_id=p_id and w.weekday=extract(dow from p_start at time zone 'America/Sao_Paulo') and p_start>=(((p_start at time zone 'America/Sao_Paulo')::date+w.opens) at time zone 'America/Sao_Paulo') and p_end<=(((p_start at time zone 'America/Sao_Paulo')::date+w.closes) at time zone 'America/Sao_Paulo'))
 and not exists(select 1 from schedule_blocks where professional_id=p_id and tstzrange(starts_at,ends_at,'[)')&&tstzrange(p_start,p_end,'[)'))
 and not exists(select 1 from bookings where professional_id=p_id and status='confirmed' and (p_exclude is null or id<>p_exclude) and tstzrange(starts_at,ends_at,'[)')&&tstzrange(p_start,p_end,'[)'))
$$;
create function assert_booking_time(p_start timestamptz) returns void language plpgsql set search_path=public as $$
 declare cfg jsonb;step int;
 begin
 select content into cfg from site_settings;step:=coalesce((cfg->>'stepMinutes')::int,10);
 if p_start is null or p_start<now()+make_interval(mins=>coalesce((cfg->>'leadMinutes')::int,30)) or (p_start at time zone 'America/Sao_Paulo')::date>(now() at time zone 'America/Sao_Paulo')::date+coalesce((cfg->>'horizonDays')::int,60) then raise exception 'TOO_LATE';end if;
 if extract(second from p_start)<>0 or (extract(hour from p_start at time zone 'America/Sao_Paulo')::int*60+extract(minute from p_start at time zone 'America/Sao_Paulo')::int)%step<>0 then raise exception 'VALIDATION';end if;
 end$$;
create function list_slots(p_service_id uuid,p_professional_id uuid,p_date date) returns jsonb language plpgsql security definer set search_path=public as $$
 declare cfg jsonb;duration int;result jsonb;
 begin
 select content into cfg from site_settings;
 if not coalesce((cfg->>'bookingEnabled')::boolean,false) then return '[]';end if;
 select duration_minutes into duration from services where id=p_service_id and active;
 if duration is null or p_date<(now() at time zone 'America/Sao_Paulo')::date or p_date>(now() at time zone 'America/Sao_Paulo')::date+coalesce((cfg->>'horizonDays')::int,60) then return '[]';end if;
 select coalesce(jsonb_agg(jsonb_build_object('startsAt',t,'endsAt',t+make_interval(mins=>duration),'professionalId',p.id)order by t,p.sort_order),'[]') into result
 from professionals p join professional_services ps on ps.professional_id=p.id and ps.service_id=p_service_id
 cross join generate_series(p_date::timestamp,(p_date+1)::timestamp-interval '1 minute',make_interval(mins=>coalesce((cfg->>'stepMinutes')::int,10))) local_t
 cross join lateral(select local_t at time zone 'America/Sao_Paulo' t) times
 where p.active and(p_professional_id is null or p.id=p_professional_id) and t>=now()+make_interval(mins=>coalesce((cfg->>'leadMinutes')::int,30)) and can_fit(p.id,t,t+make_interval(mins=>duration));
 return result;
 end$$;
create function booking_json(p_id uuid) returns jsonb language sql stable set search_path=public as $$
 select jsonb_build_object('id',b.id,'code',b.code,'startsAt',b.starts_at,'endsAt',b.ends_at,'serviceId',b.service_id,'professionalId',b.professional_id,'serviceName',b.service_name,'professionalName',b.professional_name,'priceCents',b.price_cents,'durationMinutes',b.duration_minutes,'status',b.status,'customerName',c.name,'customerPhone',c.phone,'customerEmail',c.email) from bookings b join customers c on c.id=b.customer_id where b.id=p_id
$$;
create function create_booking(p_input jsonb,p_token_hash text) returns jsonb language plpgsql security definer set search_path=public as $$
 declare svc services;pro professionals;st timestamptz;en timestamptz;cid uuid;bid uuid;cfg jsonb;
 begin
 select content into cfg from site_settings;
 if not coalesce((cfg->>'bookingEnabled')::boolean,false) then raise exception 'UNAVAILABLE';end if;
 if p_input->>'consent'<>'true' or coalesce(length(p_input#>>'{customer,name}'),0)<2 or coalesce(p_input#>>'{customer,phone}','')!~'^[0-9]{10,15}$' or length(p_token_hash)<>64 then raise exception 'VALIDATION';end if;
 select * into svc from services where id=(p_input->>'serviceId')::uuid and active;
 if svc.id is null then raise exception 'NOT_FOUND';end if;
 st:=(p_input->>'startsAt')::timestamptz;perform assert_booking_time(st);en:=st+make_interval(mins=>svc.duration_minutes);
 for pro in select p.* from professionals p join professional_services ps on ps.professional_id=p.id and ps.service_id=svc.id where p.active and(p_input->>'professionalId' is null or p.id=(p_input->>'professionalId')::uuid) order by p.id loop
 perform pg_advisory_xact_lock(hashtextextended(pro.id::text,0));
 if can_fit(pro.id,st,en) then
 insert into customers(name,phone,email) values(trim(p_input#>>'{customer,name}'),p_input#>>'{customer,phone}',nullif(p_input#>>'{customer,email}','')) returning id into cid;
 insert into bookings(service_id,professional_id,customer_id,service_name,professional_name,price_cents,duration_minutes,starts_at,ends_at,token_hash)values(svc.id,pro.id,cid,svc.name,pro.name,svc.price_cents,svc.duration_minutes,st,en,p_token_hash) returning id into bid;
 return booking_json(bid);
 end if;
 end loop;
 raise exception 'CONFLICT';
 end$$;
create function manage_booking(p_token_hash text,p_action text,p_starts_at timestamptz default null)returns jsonb language plpgsql security definer set search_path=public as $$
 declare b bookings;hours int;
 begin
 select * into b from bookings where token_hash=p_token_hash order by created_at limit 1;
 if b.id is null then raise exception 'NOT_FOUND';end if;
 if p_action='view' then return booking_json(b.id);end if;
 perform pg_advisory_xact_lock(hashtextextended(b.professional_id::text,0));
 select * into b from bookings where id=b.id for update;
 select coalesce((content->>'cancelHours')::int,2) into hours from site_settings;
 if b.status<>'confirmed' or b.starts_at<now()+make_interval(hours=>hours) then raise exception 'TOO_LATE';end if;
 if p_action='cancel' then update bookings set status='cancelled'where id=b.id;
 elsif p_action='reschedule' then
 perform assert_booking_time(p_starts_at);
 if not can_fit(b.professional_id,p_starts_at,p_starts_at+make_interval(mins=>b.duration_minutes),b.id) then raise exception 'CONFLICT';end if;
 update bookings set starts_at=p_starts_at,ends_at=p_starts_at+make_interval(mins=>b.duration_minutes)where id=b.id;
 else raise exception 'VALIDATION';end if;
 return booking_json(b.id);
 end$$;
create function consume_limit(p_key text,p_limit int,p_window_seconds int)returns boolean language plpgsql security definer set search_path=public as $$
 declare n int;
 begin
 insert into request_limits as r(key)values(p_key) on conflict(key) do update set hits=case when r.window_start<now()-make_interval(secs=>p_window_seconds)then 1 else r.hits+1 end,window_start=case when r.window_start<now()-make_interval(secs=>p_window_seconds)then now()else r.window_start end returning hits into n;
 delete from request_limits where window_start<now()-interval '1 day';
 return n<=p_limit;
 end$$;
create function save_schedule(p_professional_id uuid,p_hours jsonb,p_blocks jsonb)returns void language plpgsql security definer set search_path=public as $$
 declare b bookings;
 begin
 perform pg_advisory_xact_lock(hashtextextended(p_professional_id::text,0));
 delete from working_hours where professional_id=p_professional_id;
 insert into working_hours(professional_id,weekday,opens,closes)select p_professional_id,(j->>'weekday')::int,(j->>'start')::time,(j->>'end')::time from jsonb_array_elements(p_hours)j;
 delete from schedule_blocks where professional_id=p_professional_id;
 insert into schedule_blocks(professional_id,starts_at,ends_at,reason)select p_professional_id,(j->>'startsAt')::timestamptz,(j->>'endsAt')::timestamptz,coalesce(j->>'reason','')from jsonb_array_elements(p_blocks)j;
 for b in select * from bookings where professional_id=p_professional_id and status='confirmed' and ends_at>now()loop
 if not can_fit(p_professional_id,b.starts_at,b.ends_at,b.id)then raise exception 'CONFLICT: existem agendamentos nessa faixa';end if;
 end loop;
 end$$;
create function admin_create_booking(p_input jsonb)returns jsonb language plpgsql security definer set search_path=public as $$
 begin if not is_admin() then raise exception 'UNAUTHORIZED';end if;return create_booking(p_input,encode(gen_random_bytes(32),'hex'));end$$;
-- pgcrypto provides private tokens for manual bookings; no token is exposed on the dashboard.
create extension if not exists pgcrypto;
create function admin_update_booking(p_id uuid,p_patch jsonb)returns jsonb language plpgsql security definer set search_path=public as $$
 declare b bookings;st timestamptz;ns text;
 begin
 if not is_admin() then raise exception 'UNAUTHORIZED';end if;
 select * into b from bookings where id=p_id;if b.id is null then raise exception 'NOT_FOUND';end if;
 perform pg_advisory_xact_lock(hashtextextended(b.professional_id::text,0));select * into b from bookings where id=p_id for update;
 ns:=coalesce(p_patch->>'status',b.status);
 if b.status in('completed','no_show') and ns<>b.status then raise exception 'VALIDATION';end if;
 if ns in('completed','no_show') and b.starts_at>now()then raise exception 'TOO_LATE';end if;
 st:=coalesce((p_patch->>'startsAt')::timestamptz,b.starts_at);
 if st<>b.starts_at or(ns='confirmed'and b.status<>'confirmed')then
 perform assert_booking_time(st);
 if not can_fit(b.professional_id,st,st+make_interval(mins=>b.duration_minutes),b.id)then raise exception 'CONFLICT';end if;
 end if;
 update bookings set status=ns,starts_at=st,ends_at=st+make_interval(mins=>b.duration_minutes)where id=p_id;
 return booking_json(p_id);
 end$$;
create function admin_update_schedule(p_professional_id uuid,p_schedule jsonb)returns void language plpgsql security definer set search_path=public as $$
 begin if not is_admin()then raise exception 'UNAUTHORIZED';end if;perform save_schedule(p_professional_id,p_schedule->'hours',p_schedule->'blocks');end$$;
create function admin_save_professional(p_id uuid,p_input jsonb)returns uuid language plpgsql security definer set search_path=public as $$
 declare pid uuid:=coalesce(p_id,gen_random_uuid());
 begin
 if not is_admin()then raise exception 'UNAUTHORIZED';end if;
 perform pg_advisory_xact_lock(hashtextextended(pid::text,0));
 insert into professionals(id,name,specialty,image_url,active,sort_order)values(pid,p_input->>'name',p_input->>'specialty',p_input->>'imageUrl',(p_input->>'active')::boolean,(p_input->>'sortOrder')::int)
 on conflict(id)do update set name=excluded.name,specialty=excluded.specialty,image_url=excluded.image_url,active=excluded.active,sort_order=excluded.sort_order;
 delete from professional_services where professional_id=pid;
 insert into professional_services select pid,value::uuid from jsonb_array_elements_text(p_input->'serviceIds');return pid;
 end$$;
-- No internal helper may be executed directly by an anonymous or normal authenticated user.
revoke execute on all functions in schema public from public;
grant execute on function is_admin() to anon,authenticated,service_role;
grant execute on function list_slots(uuid,uuid,date),create_booking(jsonb,text),manage_booking(text,text,timestamptz),consume_limit(text,int,int) to service_role;
grant execute on function admin_create_booking(jsonb),admin_update_booking(uuid,jsonb),admin_update_schedule(uuid,jsonb),admin_save_professional(uuid,jsonb)to authenticated;
