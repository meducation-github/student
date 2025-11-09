create table public.news (
  id uuid not null default extensions.uuid_generate_v4 (),
  institute_id uuid not null,
  title text not null,
  description text not null,
  image_url text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint news_pkey primary key (id),
  constraint news_institute_id_fkey foreign KEY (institute_id) references institutes (id)
) TABLESPACE pg_default;

create index IF not exists news_institute_id_idx on public.news using btree (institute_id) TABLESPACE pg_default;

create index IF not exists news_created_at_idx on public.news using btree (created_at) TABLESPACE pg_default;