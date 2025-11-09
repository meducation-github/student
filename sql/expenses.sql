create table public.expenses (
  id uuid not null default extensions.uuid_generate_v4 (),
  institute_id uuid not null,
  session_id uuid not null,
  title text not null,
  description text null,
  amount numeric(10, 2) not null,
  expense_date date not null,
  category text not null,
  is_recurring boolean null default false,
  recurrence_pattern jsonb null,
  sub_expenses jsonb null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint expenses_pkey primary key (id),
  constraint expenses_institute_id_fkey foreign KEY (institute_id) references institutes (id),
  constraint expenses_session_id_fkey foreign KEY (session_id) references sessions (id)
) TABLESPACE pg_default;