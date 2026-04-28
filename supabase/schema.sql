-- ─────────────────────────────────────────────────────────────────────────────
-- Apex Humans — Instructor Scheduling Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Modules ───────────────────────────────────────────────────────────────────
create table if not exists modules (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now()
);

-- ── Courses ───────────────────────────────────────────────────────────────────
-- id is a short string like 'c1'…'c6'; admin can add more via the CourseBuilder
-- days/groups are JSONB because CourseBuilder stores nested day+group structures
create table if not exists courses (
  id         text primary key,
  code       text not null,
  name       text not null,
  full_title text,
  short_name text,
  color      text,
  num        integer,
  track      integer,
  days       jsonb not null default '[]',
  groups     jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- ── Instructors ───────────────────────────────────────────────────────────────
create table if not exists instructors (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text,
  created_at timestamptz not null default now()
);

-- ── Instructor ↔ Module eligibility (many-to-many) ───────────────────────────
create table if not exists instructor_modules (
  instructor_id uuid not null references instructors(id) on delete cascade,
  module_id     uuid not null references modules(id)     on delete cascade,
  primary key (instructor_id, module_id)
);

-- ── Cohorts ───────────────────────────────────────────────────────────────────
create table if not exists cohorts (
  id         uuid primary key default gen_random_uuid(),
  course_id  text not null references courses(id) on delete restrict,
  start_date date not null,
  sections   integer not null default 1,
  created_at timestamptz not null default now()
);

-- ── Claims ────────────────────────────────────────────────────────────────────
-- One claim per (cohort, day, section) — enforced by unique constraint
-- course_id, date, instructor_type are denormalized from the slot for query convenience
create table if not exists claims (
  id              uuid primary key default gen_random_uuid(),
  cohort_id       uuid not null references cohorts(id) on delete cascade,
  course_id       text references courses(id) on delete set null,
  day             integer not null check (day between 1 and 5),
  section         integer not null check (section >= 1),
  date            date,
  instructor_type text,
  instructor_id   uuid references instructors(id) on delete set null,
  instructor_name text not null,
  created_at      timestamptz not null default now(),
  unique (cohort_id, day, section)
);

-- ── Notifications ─────────────────────────────────────────────────────────────
-- instructor_id null means broadcast to all instructors
create table if not exists notifications (
  id            uuid primary key default gen_random_uuid(),
  type          text not null,
  title         text not null,
  message       text,
  instructor_id uuid references instructors(id) on delete cascade,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

alter table modules       enable row level security;
alter table courses       enable row level security;
alter table instructors   enable row level security;
alter table instructor_modules enable row level security;
alter table cohorts       enable row level security;
alter table claims        enable row level security;
alter table notifications enable row level security;

-- Anon key: read-only on everything (instructors browsing slots, reading courses)
create policy "public read modules"            on modules            for select using (true);
create policy "public read courses"            on courses            for select using (true);
create policy "public read instructors"        on instructors        for select using (true);
create policy "public read instructor_modules" on instructor_modules for select using (true);
create policy "public read cohorts"            on cohorts            for select using (true);
create policy "public read claims"             on claims             for select using (true);
create policy "public read notifications"      on notifications      for select using (true);

-- Anon key: instructors can insert/delete their own claims
create policy "instructors insert claims" on claims for insert with check (true);
create policy "instructors delete claims" on claims for delete using (true);

-- Anon key: instructors can mark notifications read
create policy "instructors update notifications" on notifications
  for update using (true) with check (true);

-- The admin and instructor apps both run in the browser using the anon key
-- (role separation is via VITE_ROLE env var, not Supabase auth).
-- All mutations are therefore permitted via anon key.
create policy "anon insert modules"       on modules       for insert with check (true);
create policy "anon update modules"       on modules       for update using (true);
create policy "anon delete modules"       on modules       for delete using (true);
create policy "anon insert courses"       on courses       for insert with check (true);
create policy "anon update courses"       on courses       for update using (true);
create policy "anon delete courses"       on courses       for delete using (true);
create policy "anon insert instructors"   on instructors   for insert with check (true);
create policy "anon update instructors"   on instructors   for update using (true);
create policy "anon delete instructors"   on instructors   for delete using (true);
create policy "anon insert instructor_modules" on instructor_modules for insert with check (true);
create policy "anon delete instructor_modules" on instructor_modules for delete using (true);
create policy "anon insert cohorts"       on cohorts       for insert with check (true);
create policy "anon update cohorts"       on cohorts       for update using (true);
create policy "anon delete cohorts"       on cohorts       for delete using (true);
create policy "anon insert notifications" on notifications for insert with check (true);
