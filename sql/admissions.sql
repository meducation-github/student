create table public.admissions (
  id uuid not null default gen_random_uuid (),
  institute_id uuid not null,
  student_id uuid not null,
  session_id uuid not null,
  form_data jsonb not null,
  submitted_at timestamp with time zone null default now(),
  status text null default 'pending'::text,
  reviewer_id uuid null,
  reviewed_at timestamp with time zone null,
  notes text null,
  constraint admissions_pkey primary key (id),
  constraint admissions_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'reviewing'::text,
          'approved'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_admissions_institute on public.admissions using btree (institute_id) TABLESPACE pg_default;

create index IF not exists idx_admissions_student on public.admissions using btree (student_id) TABLESPACE pg_default;

create index IF not exists idx_admissions_session on public.admissions using btree (session_id) TABLESPACE pg_default;

create index IF not exists idx_admissions_status on public.admissions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_admissions_submitted_at on public.admissions using btree (submitted_at) TABLESPACE pg_default;