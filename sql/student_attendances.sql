create table public.student_attendances (
  id bigint generated always as identity not null,
  institute_id uuid not null,
  session_id uuid not null,
  student_id uuid not null,
  attendance_date date not null,
  attendance_year smallint not null,
  attendance_month smallint not null,
  status character varying(20) not null,
  recorded_at timestamp with time zone null default CURRENT_TIMESTAMP,
  recorded_by uuid null,
  constraint student_attendances_pkey primary key (id),
  constraint student_attendances_institute_id_session_id_student_id_atte_key unique (
    institute_id,
    session_id,
    student_id,
    attendance_date
  ),
  constraint student_attendances_recorded_by_fkey foreign KEY (recorded_by) references staff (id),
  constraint student_attendances_session_id_fkey foreign KEY (session_id) references sessions (id),
  constraint student_attendances_student_id_fkey foreign KEY (student_id) references students (id),
  constraint student_attendances_institute_id_fkey foreign KEY (institute_id) references institutes (id),
  constraint student_attendances_status_check check (
    (
      (status)::text = any (
        (
          array[
            'present'::character varying,
            'absent'::character varying,
            'leave'::character varying,
            'half_day'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint student_attendances_attendance_month_check check (
    (
      (attendance_month >= 1)
      and (attendance_month <= 12)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_student_attendances_institute on public.student_attendances using btree (institute_id) TABLESPACE pg_default;

create index IF not exists idx_student_attendances_session on public.student_attendances using btree (session_id) TABLESPACE pg_default;

create index IF not exists idx_student_attendances_student on public.student_attendances using btree (student_id) TABLESPACE pg_default;

create index IF not exists idx_student_attendances_date on public.student_attendances using btree (attendance_date) TABLESPACE pg_default;

create index IF not exists idx_student_attendances_year_month on public.student_attendances using btree (attendance_year, attendance_month) TABLESPACE pg_default;