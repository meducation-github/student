create table public.events (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  description text not null,
  date date not null,
  time time without time zone not null,
  location text not null,
  image_url text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  institute_id uuid not null,
  constraint events_pkey primary key (id),
  constraint events_institute_id_fkey foreign KEY (institute_id) references institutes (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists events_institute_id_idx on public.events using btree (institute_id) TABLESPACE pg_default;

create index IF not exists events_date_idx on public.events using btree (date) TABLESPACE pg_default;