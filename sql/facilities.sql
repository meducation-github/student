create table public.facilities (
  id uuid not null default extensions.uuid_generate_v4 (),
  institute_id uuid not null,
  name character varying(100) not null,
  icon character varying(50) not null,
  description text null,
  is_default boolean null default false,
  default_id character varying(50) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint facilities_pkey primary key (id),
  constraint facilities_institute_id_fkey foreign KEY (institute_id) references institutes (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists facilities_institute_id_idx on public.facilities using btree (institute_id) TABLESPACE pg_default;