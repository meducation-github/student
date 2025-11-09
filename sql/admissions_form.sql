create table public.admissions_form (
  id uuid not null default gen_random_uuid (),
  institute_id uuid not null,
  form_data jsonb not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint admissions_form_pkey primary key (id),
  constraint unique_institute unique (institute_id)
) TABLESPACE pg_default;

create trigger update_admissions_form_timestamp BEFORE
update on admissions_form for EACH row
execute FUNCTION update_timestamp ();