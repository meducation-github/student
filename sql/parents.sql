create table public.parents (
  id uuid not null default extensions.uuid_generate_v4 (),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text null,
  address text null,
  occupation text null,
  relationship text not null default 'Parent'::text,
  student_ids text null,
  institute_id uuid not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint parents_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists parents_institute_id_idx on public.parents using btree (institute_id) TABLESPACE pg_default;

create trigger update_parents_updated_at BEFORE
update on parents for EACH row
execute FUNCTION update_updated_at_column ();