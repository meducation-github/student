create table public.staff_attendances (
  id bigint generated always as identity not null,
  institute_id uuid not null,
  session_id uuid not null,
  staff_id uuid not null,
  attendance_date date not null,
  attendance_year smallint not null,
  attendance_month smallint not null,
  status character varying(20) not null,
  recorded_at timestamp with time zone null default CURRENT_TIMESTAMP,
  recorded_by uuid null,
  constraint staff_attendances_pkey primary key (id),
  constraint staff_attendances_institute_id_session_id_staff_id_attendan_key unique (
    institute_id,
    session_id,
    staff_id,
    attendance_date
  ),
  constraint staff_attendances_staff_id_fkey foreign KEY (staff_id) references staff (id),
  constraint staff_attendances_institute_id_fkey foreign KEY (institute_id) references institutes (id),
  constraint staff_attendances_recorded_by_fkey foreign KEY (recorded_by) references staff (id),
  constraint staff_attendances_session_id_fkey foreign KEY (session_id) references sessions (id),
  constraint staff_attendances_status_check check (
    (
      (status)::text = any (
        (
          array[
            'present'::character varying,
            'absent'::character varying,
            'leave'::character varying,
            'half_day'::character varying,
            'wfh'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint staff_attendances_attendance_month_check check (
    (
      (attendance_month >= 1)
      and (attendance_month <= 12)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_staff_attendances_institute on public.staff_attendances using btree (institute_id) TABLESPACE pg_default;

create index IF not exists idx_staff_attendances_session on public.staff_attendances using btree (session_id) TABLESPACE pg_default;

create index IF not exists idx_staff_attendances_staff on public.staff_attendances using btree (staff_id) TABLESPACE pg_default;

create index IF not exists idx_staff_attendances_date on public.staff_attendances using btree (attendance_date) TABLESPACE pg_default;

create index IF not exists idx_staff_attendances_year_month on public.staff_attendances using btree (attendance_year, attendance_month) TABLESPACE pg_default;