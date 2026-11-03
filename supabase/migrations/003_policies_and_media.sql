do $$declare t text;begin foreach t in array array['site_settings','services','professionals','professional_services','working_hours','schedule_blocks','customers','bookings','admin_users','request_limits']loop
 execute format('alter table %I enable row level security',t);
 execute format('grant select on %I to anon,authenticated',t);
 execute format('grant all on %I to service_role',t);
 if t not in('admin_users','request_limits')then
 execute format('grant insert,update,delete on %I to authenticated',t);
 execute format('create policy admin_all on %I for all to authenticated using(is_admin())with check(is_admin())',t);
 end if;
 end loop;end$$;
create policy public_settings on site_settings for select to anon,authenticated using(true);
create policy public_services on services for select to anon,authenticated using(active);
create policy public_professionals on professionals for select to anon,authenticated using(active);
create policy public_links on professional_services for select to anon,authenticated using(exists(select 1 from professionals where id=professional_id and active)and exists(select 1 from services where id=service_id and active));
-- Bookings and schedule writes must go through transactional RPCs, never raw REST writes.
revoke insert,update,delete on bookings,working_hours,schedule_blocks,professional_services from authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('site-images','site-images',true,5242880,array['image/jpeg','image/png','image/webp'])on conflict(id)do nothing;
create policy published_image_read on storage.objects for select to public using(bucket_id='site-images');
create policy admin_image_write on storage.objects for insert to authenticated with check(bucket_id='site-images'and public.is_admin());
create policy admin_image_delete on storage.objects for delete to authenticated using(bucket_id='site-images'and public.is_admin());
