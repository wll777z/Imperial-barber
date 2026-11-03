create function admin_overview()returns jsonb language plpgsql security definer set search_path=public as $$
 declare result jsonb;
 begin
 if not is_admin()then raise exception 'UNAUTHORIZED';end if;
 select jsonb_build_object('today',(select count(*)from bookings where(starts_at at time zone 'America/Sao_Paulo')::date=(now()at time zone 'America/Sao_Paulo')::date and status='confirmed'),'customers',(select count(distinct phone)from customers),'services',(select count(*)from services where active),'revenue',(select coalesce(sum(price_cents),0)from bookings where status='completed'and date_trunc('month',starts_at at time zone 'America/Sao_Paulo')=date_trunc('month',now()at time zone 'America/Sao_Paulo')),'next',(select coalesce(jsonb_agg(booking_json(id)order by starts_at),'[]')from(select id,starts_at from bookings where status='confirmed'and starts_at>=now()order by starts_at limit 8)b),'chart',(select jsonb_agg(jsonb_build_object('date',d,'count',(select count(*)from bookings where(starts_at at time zone 'America/Sao_Paulo')::date=d::date and status<>'cancelled'))order by d)from generate_series((now()at time zone 'America/Sao_Paulo')::date-6,(now()at time zone 'America/Sao_Paulo')::date,interval'1 day')d))into result;
 return result;
 end$$;
revoke all on function admin_overview()from public;grant execute on function admin_overview()to authenticated;
create function admin_list_bookings(p_date date default null,p_pro uuid default null,p_customer uuid default null,p_status text default null,p_offset int default 0)returns jsonb language plpgsql security definer set search_path=public as $$
 declare rows jsonb;total int;
 begin
 if not is_admin()then raise exception 'UNAUTHORIZED';end if;
 if p_offset<0 then raise exception 'VALIDATION';end if;
 select count(*)into total from bookings where(p_date is null or(starts_at at time zone 'America/Sao_Paulo')::date=p_date)and(p_pro is null or professional_id=p_pro)and(p_customer is null or customer_id=p_customer)and(p_status is null or status=p_status);
 select coalesce(jsonb_agg(booking_json(id)||jsonb_build_object('customerId',customer_id)order by starts_at desc),'[]')into rows from(select id,customer_id,starts_at from bookings where(p_date is null or(starts_at at time zone 'America/Sao_Paulo')::date=p_date)and(p_pro is null or professional_id=p_pro)and(p_customer is null or customer_id=p_customer)and(p_status is null or status=p_status)order by starts_at desc,id limit 200 offset p_offset)b;
 return jsonb_build_object('items',rows,'total',total);
 end$$;
revoke all on function admin_list_bookings(date,uuid,uuid,text,int)from public;grant execute on function admin_list_bookings(date,uuid,uuid,text,int)to authenticated;
