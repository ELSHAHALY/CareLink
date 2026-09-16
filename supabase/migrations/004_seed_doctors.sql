-- 004_seed_doctors.sql
-- Seeds the doctors table with data from doctors.json

INSERT INTO public.doctors (id, name, specialty, email) VALUES
  ('doc-001', 'Dr. James Mitchell', 'Cardiologist', 'j.mitchell@carelink.com'),
  ('doc-002', 'Dr. Sarah Chen', 'Dermatologist', 's.chen@carelink.com'),
  ('doc-003', 'Dr. Robert Kim', 'Neurologist', 'r.kim@carelink.com'),
  ('doc-004', 'Dr. Emily Carter', 'Pediatrician', 'e.carter@carelink.com'),
  ('doc-005', 'Dr. Michael Anderson', 'Orthopedic Surgeon', 'm.anderson@carelink.com'),
  ('doc-006', 'Dr. Olivia Brown', 'Gynecologist', 'o.brown@carelink.com'),
  ('doc-007', 'Dr. Daniel Wilson', 'Cardiologist', 'd.wilson@carelink.com'),
  ('doc-008', 'Dr. Sophia Martinez', 'Dermatologist', 's.martinez@carelink.com'),
  ('doc-009', 'Dr. William Taylor', 'Neurologist', 'w.taylor@carelink.com'),
  ('doc-010', 'Dr. Emma Davis', 'Pediatrician', 'e.davis@carelink.com'),
  ('doc-011', 'Dr. Christopher Lee', 'Orthopedic Surgeon', 'c.lee@carelink.com'),
  ('doc-012', 'Dr. Rachel Thompson', 'Gynecologist', 'r.thompson@carelink.com')
ON CONFLICT (id) DO NOTHING;

-- Seed the first admin user.
-- This uses SECURITY DEFINER so it runs as the superuser regardless of RLS.
-- The admin must first register via the app (or Auth Dashboard), then this
-- script promotes their profile to admin.
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@carelink.com';

-- For initial setup, create the admin via a SECURITY DEFINER function.
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET role = 'admin' WHERE email = target_email;
END;
$$;
