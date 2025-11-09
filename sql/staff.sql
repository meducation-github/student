create table public.staff (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  email text not null,
  phone text null,
  department text null,
  designation text null,
  address text null,
  joining_date date null,
  salary numeric null,
  is_active boolean null default true,
  institute_id uuid not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  user_id uuid null,
  role text null,
  constraint staff_pkey primary key (id),
  constraint staff_email_key unique (email),
  constraint staff_institute_id_fkey foreign KEY (institute_id) references institutes (id),
  constraint staff_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists staff_institute_id_idx on public.staff using btree (institute_id) TABLESPACE pg_default;

create trigger update_staff_updated_at BEFORE
update on staff for EACH row
execute FUNCTION update_updated_at_column ();