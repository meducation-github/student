create table public.sessions (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  institute_id uuid not null,
  start_date date not null,
  end_date date not null,
  is_active boolean null default false,
  description text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint sessions_pkey primary key (id),
  constraint sessions_institute_id_fkey foreign KEY (institute_id) references institutes (id)
) TABLESPACE pg_default;