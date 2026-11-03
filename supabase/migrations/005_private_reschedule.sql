create function list_booking_slots(p_token_hash text,p_date date)returns jsonb language plpgsql security definer set search_path=public as $$
 declare b bookings;cfg jsonb;result jsonb;
 begin
 select * into b from bookings where token_hash=p_token_hash order by created_at limit 1;
 if b.id is null then raise exception 'NOT_FOUND';end if;
 select content into cfg from site_settings;
 if b.status<>'confirmed' or b.starts_at<now()+make_interval(hours=>coalesce((cfg->>'cancelHours')::int,2))then raise exception 'TOO_LATE';end if;
 if p_date<(now()at time zone 'America/Sao_Paulo')::date or p_date>(now()at time zone 'America/Sao_Paulo')::date+coalesce((cfg->>'horizonDays')::int,60)then return '[]';end if;
 select coalesce(jsonb_agg(jsonb_build_object('startsAt',t,'endsAt',t+make_interval(mins=>b.duration_minutes),'professionalId',b.professional_id)order by t),'[]')into result
 from generate_series(p_date::timestamp,(p_date+1)::timestamp-interval '1 minute',make_interval(mins=>coalesce((cfg->>'stepMinutes')::int,10))) local_t
 cross join lateral(select local_t at time zone 'America/Sao_Paulo' t)times
 where t>=now()+make_interval(mins=>coalesce((cfg->>'leadMinutes')::int,30))and can_fit(b.professional_id,t,t+make_interval(mins=>b.duration_minutes),b.id);
 return result;
 end$$;
revoke all on function list_booking_slots(text,date)from public;grant execute on function list_booking_slots(text,date)to service_role;
