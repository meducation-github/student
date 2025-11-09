create table public.students (
  id uuid not null default extensions.uuid_generate_v4 (),
  first_name text not null,
  last_name text not null,
  father_name text not null,
  address text not null,
  grade uuid not null default gen_random_uuid (),
  status text not null,
  phone text null,
  email text null,
  date_of_birth date null,
  admission_date date not null,
  institute_id uuid not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  session_id uuid null,
  constraint students_pkey primary key (id),
  constraint students_grade_fkey foreign KEY (grade) references grades (id),
  constraint students_institute_id_fkey foreign KEY (institute_id) references institutes (id),
  constraint students_session_id_fkey foreign KEY (session_id) references sessions (id)
) TABLESPACE pg_default;

create index IF not exists students_institute_id_idx on public.students using btree (institute_id) TABLESPACE pg_default;

create trigger update_students_timestamp BEFORE
update on students for EACH row
execute FUNCTION update_timestamp ();