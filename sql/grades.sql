create table public.grades (
  id uuid not null default extensions.uuid_generate_v4 (),
  created_at timestamp with time zone null default now(),
  name text null,
  level text not null,
  description text null,
  institute_id uuid not null,
  constraint grades_pkey primary key (id),
  constraint grades_level_institute_id_key unique (level, institute_id)
) TABLESPACE pg_default;

create index IF not exists idx_grades_institute_id on public.grades using btree (institute_id) TABLESPACE pg_default;