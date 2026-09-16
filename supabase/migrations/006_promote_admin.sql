-- 006_promote_admin.sql
-- Promotes the initial admin user to admin role.

SELECT public.promote_to_admin('admin@carelink.com');
