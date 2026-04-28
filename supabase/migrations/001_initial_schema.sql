-- ============================================================
-- Apex Humans Instructor Scheduler — Initial Schema
-- Paste this entire file into Supabase SQL Editor and run it.
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- MODULES
-- Reusable teaching units that courses are composed of.
-- ============================================================
create table modules (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  tags        text[] default '{}',
  created_at  timestamptz default now()
);

-- ============================================================
-- COURSES
-- Dynamically defined by admin (replaces hardcoded courses.js).
-- ============================================================
create table courses (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,          -- e.g. "C1"
  name       text not null,                 -- e.g. "Roblox Game Dev"
  full_title text,
  color      text default '#7c6af7',
  track      int  default 1,
  created_at timestamptz default now()
);

-- ============================================================
-- COURSE DAYS
-- Each row = one day/module within a course.
-- ============================================================
create table course_days (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references courses(id) on delete cascade,
  day_number    int  not null,              -- 1-based ordering
  module_id     uuid references modules(id) on delete set null,
  label         text,                       -- override label if desired
  start_time    time default '09:00',
  hours_per_day numeric(4,2) default 8,
  unique (course_id, day_number)
);

-- ============================================================
-- COURSE INSTRUCTOR GROUPS
-- Groups days that must be taught by the same instructor.
-- e.g. group_name="Core AI", day_numbers=[1,2]
-- ============================================================
create table course_instructor_groups (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references courses(id) on delete cascade,
  group_name  text not null,
  day_numbers int[] not null               -- e.g. {1,2}
);

-- ============================================================
-- INSTRUCTORS
-- Admin-defined instructor list (not self-registered).
-- ============================================================
create table instructors (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text unique,
  created_at timestamptz default now()
);

-- ============================================================
-- INSTRUCTOR MODULE ELIGIBILITY
-- Which modules each instructor is allowed to teach.
-- ============================================================
create table instructor_eligibility (
  instructor_id uuid not null references instructors(id) on delete cascade,
  module_id     uuid not null references modules(id) on delete cascade,
  primary key (instructor_id, module_id)
);

-- ============================================================
-- COHORTS
-- A scheduled run of a course with N sections.
-- ============================================================
create table cohorts (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references courses(id) on delete restrict,
  sections     int  not null default 1,
  start_date   date not null,
  custom_dates date[],                    -- non-consecutive dates per day (indexed by day_number-1)
  created_at   timestamptz default now()
);

-- ============================================================
-- CLAIMS
-- An instructor claiming a slot (cohort × day × section).
-- ============================================================
create table claims (
  id            uuid primary key default gen_random_uuid(),
  cohort_id     uuid not null references cohorts(id) on delete cascade,
  course_id     uuid not null references courses(id) on delete cascade,
  day_number    int  not null,
  section       int  not null,
  instructor_id uuid references instructors(id) on delete set null,
  created_at    timestamptz default now(),
  unique (cohort_id, day_number, section)
);

-- ============================================================
-- NOTIFICATIONS
-- Admin-pushed alerts surfaced on the instructor app.
-- NULL instructor_id = broadcast to all instructors.
-- ============================================================
create table notifications (
  id            uuid primary key default gen_random_uuid(),
  type          text not null,             -- 'new_course' | 'new_slots' | 'course_updated'
  title         text not null,
  message       text,
  instructor_id uuid references instructors(id) on delete cascade,  -- null = all
  read_at       timestamptz,
  created_at    timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table modules                    enable row level security;
alter table courses                    enable row level security;
alter table course_days                enable row level security;
alter table course_instructor_groups   enable row level security;
alter table instructors                enable row level security;
alter table instructor_eligibility     enable row level security;
alter table cohorts                    enable row level security;
alter table claims                     enable row level security;
alter table notifications              enable row level security;

-- Anon (instructor app) can read everything except instructor_eligibility internals
create policy "anon_read_modules"     on modules                  for select using (true);
create policy "anon_read_courses"     on courses                  for select using (true);
create policy "anon_read_course_days" on course_days              for select using (true);
create policy "anon_read_groups"      on course_instructor_groups for select using (true);
create policy "anon_read_instructors" on instructors              for select using (true);
create policy "anon_read_eligibility" on instructor_eligibility   for select using (true);
create policy "anon_read_cohorts"     on cohorts                  for select using (true);
create policy "anon_read_claims"      on claims                   for select using (true);
create policy "anon_read_notifs"      on notifications            for select using (true);

-- Anon can insert/update/delete claims (instructors claim slots)
create policy "anon_insert_claims"    on claims for insert with check (true);
create policy "anon_delete_claims"    on claims for delete using (true);

-- Anon can mark notifications read
create policy "anon_update_notifs"    on notifications for update using (true);

-- service_role (admin app) has full access via Supabase default — no additional policy needed
-- (service_role bypasses RLS)

-- ============================================================
-- REALTIME
-- Enable realtime on tables the instructor app subscribes to.
-- ============================================================
alter publication supabase_realtime add table cohorts;
alter publication supabase_realtime add table claims;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table courses;
alter publication supabase_realtime add table course_days;
