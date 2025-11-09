create table public.institutes (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  address text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint institutes_pkey primary key (id)
) TABLESPACE pg_default;

create trigger update_institutes_timestamp BEFORE
update on institutes for EACH row
execute FUNCTION update_timestamp ();