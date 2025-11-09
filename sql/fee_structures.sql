create table public.fee_structures (
  id uuid not null default extensions.uuid_generate_v4 (),
  institute_id uuid not null,
  grade character varying(2) not null,
  fee_cycle text not null check (fee_cycle in ('monthly', 'quarterly', 'semester', 'yearly')),
  total_amount numeric(10, 2) not null default 0,
  due_date_start integer not null check (due_date_start between 1 and 31),
  due_date_end integer not null check (due_date_end between 1 and 31),
  sub_fees jsonb not null default '[]'::jsonb,
  session_id uuid not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint fee_structures_pkey primary key (id),
  constraint unique_grade_per_institute_per_session unique (institute_id, grade, session_id),
  constraint fee_structures_session_id_fkey foreign key (session_id) references sessions (id),
  constraint valid_due_date_range check (due_date_start <= due_date_end)
) TABLESPACE pg_default;

create index if not exists idx_fee_structures_institute on public.fee_structures using btree (institute_id) TABLESPACE pg_default;
create index if not exists idx_fee_structures_session on public.fee_structures using btree (session_id) TABLESPACE pg_default;