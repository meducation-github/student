create table public.plans (
  id serial not null,
  institute_id uuid not null,
  plan text null,
  status text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint plans_pkey primary key (id)
) TABLESPACE pg_default;