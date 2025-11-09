create table public.salaries (
  id uuid not null default extensions.uuid_generate_v4 (),
  staff_id uuid not null,
  amount numeric not null,
  month text not null,
  year integer not null,
  institute_id uuid not null,
  session_id uuid not null,
  payment_date date not null,
  status text not null default 'paid'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint salaries_pkey primary key (id),
  constraint salaries_institute_id_fkey foreign KEY (institute_id) references institutes (id),
  constraint salaries_session_id_fkey foreign KEY (session_id) references sessions (id),
  constraint salaries_staff_id_fkey foreign KEY (staff_id) references staff (id)
) TABLESPACE pg_default;