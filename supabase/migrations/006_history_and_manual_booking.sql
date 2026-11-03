-- Keep customer identities as submitted per booking; group histories by phone for administration.
create index if not exists customers_phone on customers(phone);
create function admin_list_customers(p_q text default '',p_offset int default 0)returns jsonb language plpgsql security definer set search_path=public as $$
 declare result jsonb;total int;
 begin
 if not is_admin()then raise exception 'UNAUTHORIZED';end if;
 if p_offset<0 then raise exception 'VALIDATION';end if;
 select count(distinct phone)into total from customers where p_q=''or name ilike '%'||p_q||'%'or phone ilike '%'||p_q||'%';
 select jsonb_build_object('items',coalesce(jsonb_agg(to_jsonb(c)order by created_at desc),'[]'),'total',total)into result from(select *from(select distinct on(phone)id,name,phone,email,created_at from customers where p_q=''or name ilike '%'||p_q||'%'or phone ilike '%'||p_q||'%'order by phone,created_at desc,id)recent order by created_at desc,id limit 200 offset p_offset)c;
 return result;
 end$$;
revoke all on function admin_list_customers(text,int)from public;grant execute on function admin_list_customers(text,int)to authenticated;
create or replace function admin_list_bookings(p_date date default null,p_pro uuid default null,p_customer uuid default null,p_status text default null,p_offset int default 0)returns jsonb language plpgsql security definer set search_path=public as $$
 declare rows jsonb;total int;
 begin
 if not is_admin()then raise exception 'UNAUTHORIZED';end if;
 if p_offset<0 then raise exception 'VALIDATION';end if;
 select count(*)into total from bookings where(p_date is null or(starts_at at time zone 'America/Sao_Paulo')::date=p_date)and(p_pro is null or professional_id=p_pro)and(p_customer is null or customer_id in(select id from customers where phone=(select phone from customers where id=p_customer)))and(p_status is null or status=p_status);
 select coalesce(jsonb_agg(booking_json(id)||jsonb_build_object('customerId',customer_id)order by starts_at desc),'[]')into rows from(select id,customer_id,starts_at from bookings where(p_date is null or(starts_at at time zone 'America/Sao_Paulo')::date=p_date)and(p_pro is null or professional_id=p_pro)and(p_customer is null or customer_id in(select id from customers where phone=(select phone from customers where id=p_customer)))and(p_status is null or status=p_status)order by starts_at desc,id limit 200 offset p_offset)b;
 return jsonb_build_object('items',rows,'total',total);
 end$$;
revoke all on function admin_list_bookings(date,uuid,uuid,text,int)from public;grant execute on function admin_list_bookings(date,uuid,uuid,text,int)to authenticated;

create or replace function admin_update_booking(p_id uuid,p_patch jsonb)returns jsonb language plpgsql security definer set search_path=public as $$
 declare b bookings;st timestamptz;ns text;
 begin
 if not is_admin() then raise exception 'UNAUTHORIZED';end if;
 select * into b from bookings where id=p_id;if b.id is null then raise exception 'NOT_FOUND';end if;
 perform pg_advisory_xact_lock(hashtextextended(b.professional_id::text,0));select * into b from bookings where id=p_id for update;
 ns:=coalesce(p_patch->>'status',b.status);
 if b.status in('completed','no_show') and ns<>b.status then raise exception 'VALIDATION';end if;
 if ns in('completed','no_show') and b.starts_at>now()then raise exception 'TOO_LATE';end if;
 st:=coalesce((p_patch->>'startsAt')::timestamptz,b.starts_at);
 if (st<>b.starts_at and(b.status<>'confirmed' or ns<>'confirmed'))or(b.status='cancelled'and ns not in('cancelled','confirmed'))then raise exception 'VALIDATION';end if;
 if st<>b.starts_at or(ns='confirmed'and b.status<>'confirmed')then
 perform assert_booking_time(st);
 if not can_fit(b.professional_id,st,st+make_interval(mins=>b.duration_minutes),b.id)then raise exception 'CONFLICT';end if;
 end if;
 update bookings set status=ns,starts_at=st,ends_at=st+make_interval(mins=>b.duration_minutes)where id=p_id;
 return booking_json(p_id);
 end$$;
create or replace function admin_create_booking(p_input jsonb)returns jsonb language plpgsql security definer set search_path=public as $$
 begin
 if not is_admin()then raise exception 'UNAUTHORIZED';end if;
 return create_booking(p_input,replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''));
 end$$;
