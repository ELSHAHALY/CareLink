-- 013_backfill_doctor_images.sql
-- Fills doctors.image for the seeded catalog rows. The seed (004) never
-- inserted images; they only existed in src/data/doctors.json and public/.
-- Values match doctors.json exactly; resolveDoctorImage() serves them from
-- the app's public folder at /doctor-N.jpg. Idempotent: only touches the
-- known seed ids and only when image is still NULL (never overwrites an
-- admin-uploaded photo).

update public.doctors as d set image = v.image
from (values
  ('doc-001','doctor-1.jpg'),
  ('doc-002','doctor-2.jpg'),
  ('doc-003','doctor-3.jpg'),
  ('doc-004','doctor-4.png'),
  ('doc-005','doctor-5.jpg'),
  ('doc-006','doctor-6.jpg'),
  ('doc-007','doctor-7.jpg'),
  ('doc-008','doctor-8.jpg'),
  ('doc-009','doctor-9.jpg'),
  ('doc-010','doctor-10.png'),
  ('doc-011','doctor-11.jpg'),
  ('doc-012','doctor-12.jpg')
) as v(id, image)
where d.id = v.id and d.image is null;
