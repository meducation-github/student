create table public.subjects (
  id uuid not null default extensions.uuid_generate_v4 (),
  created_at timestamp with time zone null default now(),
  name text not null,
  code text null,
  description text null,
  grade_id uuid not null,
  constraint subjects_pkey primary key (id),
  constraint subjects_grade_id_fkey foreign KEY (grade_id) references grades (id) on delete RESTRICT
) TABLESPACE pg_default;

create index IF not exists idx_subjects_grade_id on public.subjects using btree (grade_id) TABLESPACE pg_default;