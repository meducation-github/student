create table public.galleries (
  id uuid not null default gen_random_uuid (),
  title text null,
  images jsonb null,
  institute_id uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  constraint galleries_pkey primary key (id),
  constraint galleries_institute_id_fkey foreign KEY (institute_id) references institutes (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;