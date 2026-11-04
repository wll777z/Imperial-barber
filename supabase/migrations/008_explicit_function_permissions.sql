-- Supabase explicitly grants EXECUTE to API roles by default. Removing PUBLIC
-- alone does not remove those grants. Start closed and enumerate every API.
revoke execute on all functions in schema public from public,anon,authenticated,service_role;
alter default privileges in schema public revoke execute on functions from public,anon,authenticated,service_role;

grant execute on function is_admin()to anon,authenticated,service_role;
grant execute on function
 list_slots(uuid,uuid,date),
 create_booking(jsonb,text),
 manage_booking(text,text,timestamptz),
 list_booking_slots(text,date),
 consume_limit(text,int,int)
to service_role;

grant execute on function
 admin_create_booking(jsonb),
 admin_update_booking(uuid,jsonb),
 admin_update_schedule(uuid,jsonb),
 admin_save_professional(uuid,jsonb),
 admin_overview(),
 admin_list_bookings(date,uuid,uuid,text,int),
 admin_list_customers(text,int)
to authenticated;
-- can_fit, booking_json, assert_booking_time, save_schedule and
-- create_booking_internal remain owner-only, reached through checked wrappers.
