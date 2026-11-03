create function create_booking_internal(p_input jsonb,p_token_hash text,p_admin boolean) returns jsonb language plpgsql security definer set search_path=public as $$
 declare svc services;pro professionals;st timestamptz;en timestamptz;cid uuid;bid uuid;cfg jsonb;
 begin
 select content into cfg from site_settings;
 if not p_admin and not coalesce((cfg->>'bookingEnabled')::boolean,false) then raise exception 'UNAVAILABLE';end if;
 if coalesce(p_input->>'consent','')<>'true' or coalesce(length(p_input#>>'{customer,name}'),0)<2 or coalesce(p_input#>>'{customer,phone}','')!~'^[0-9]{10,15}$' or length(p_token_hash)<>64 then raise exception 'VALIDATION';end if;
 select * into svc from services where id=(p_input->>'serviceId')::uuid and active for share;
 if svc.id is null then raise exception 'NOT_FOUND';end if;
 st:=(p_input->>'startsAt')::timestamptz;perform assert_booking_time(st);en:=st+make_interval(mins=>svc.duration_minutes);
 for pro in select p.* from professionals p join professional_services ps on ps.professional_id=p.id and ps.service_id=svc.id where p.active and(p_input->>'professionalId' is null or p.id=(p_input->>'professionalId')::uuid) order by p.id loop
 perform pg_advisory_xact_lock(hashtextextended(pro.id::text,0));
 if exists(select 1 from professionals where id=pro.id and active)and exists(select 1 from professional_services where professional_id=pro.id and service_id=svc.id)and can_fit(pro.id,st,en)then
 insert into customers(name,phone,email) values(trim(p_input#>>'{customer,name}'),p_input#>>'{customer,phone}',nullif(p_input#>>'{customer,email}','')) returning id into cid;
 insert into bookings(service_id,professional_id,customer_id,service_name,professional_name,price_cents,duration_minutes,starts_at,ends_at,token_hash)values(svc.id,pro.id,cid,svc.name,pro.name,svc.price_cents,svc.duration_minutes,st,en,p_token_hash) returning id into bid;
 return booking_json(bid);
 end if;
 end loop;
 raise exception 'CONFLICT';
 end$$;

revoke all on function create_booking_internal(jsonb,text,boolean)from public;
create or replace function create_booking(p_input jsonb,p_token_hash text)returns jsonb language sql security definer set search_path=public as $$select create_booking_internal(p_input,p_token_hash,false)$$;
create or replace function admin_create_booking(p_input jsonb)returns jsonb language plpgsql security definer set search_path=public as $$
 begin if not is_admin()then raise exception 'UNAUTHORIZED';end if;
 return create_booking_internal(p_input,replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''),true);
 end$$;
