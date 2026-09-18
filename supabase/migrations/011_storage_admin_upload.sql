-- 011_storage_admin_upload.sql
-- Lets admins upload/manage doctor photos in the public `ccc-images` bucket
-- (doctors/…). Public read access is left untouched.
-- Run once in Dashboard → SQL Editor. Requires 009 (is_admin() helper).

-- RLS is enabled on storage.objects by default on hosted projects; keep it on.
-- (No ALTER here on purpose: never disable storage RLS.)

drop policy if exists "ccc_images_admin_insert" on storage.objects;
create policy "ccc_images_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'ccc-images' and public.is_admin()
  );

drop policy if exists "ccc_images_admin_update" on storage.objects;
create policy "ccc_images_admin_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'ccc-images' and public.is_admin()
  )
  with check (
    bucket_id = 'ccc-images' and public.is_admin()
  );

drop policy if exists "ccc_images_admin_delete" on storage.objects;
create policy "ccc_images_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'ccc-images' and public.is_admin()
  );

-- Verify after running (paste separately):
--   select policyname, cmd, roles from pg_policies
--    where schemaname='storage' and tablename='objects'
--      and policyname like 'ccc_images%';
