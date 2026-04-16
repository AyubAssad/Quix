create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  total_points integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.stages (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  stage_name text not null,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (stage_name, name)
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  stage_name text not null,
  block_name text not null,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (stage_name, block_name, name)
);

create table if not exists public.lectures (
  id uuid primary key default gen_random_uuid(),
  content_type text not null default 'quiz' check (content_type in ('quiz', 'past_paper')),
  stage text not null,
  block text not null,
  module_name text not null,
  title text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.lectures add column if not exists stage text;
alter table public.lectures add column if not exists block text;
alter table public.lectures add column if not exists module_name text;
alter table public.lectures add column if not exists content_type text not null default 'quiz';
alter table public.lectures drop constraint if exists lectures_content_type_check;
alter table public.lectures
add constraint lectures_content_type_check
check (content_type in ('quiz', 'past_paper'));

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid not null references public.lectures(id) on delete cascade,
  content_type text not null default 'quiz' check (content_type in ('quiz', 'past_paper')),
  question_type text not null default 'mcq' check (question_type in ('mcq', 'true_false')),
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text,
  option_d text,
  correct_option text not null check (correct_option in ('a', 'b', 'c', 'd')),
  points integer not null default 1 check (points = 1),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.questions add column if not exists question_type text not null default 'mcq';
alter table public.questions add column if not exists content_type text not null default 'quiz';
alter table public.questions alter column option_c drop not null;
alter table public.questions alter column option_d drop not null;
alter table public.questions alter column points set default 1;
alter table public.questions drop constraint if exists questions_content_type_check;
alter table public.questions
add constraint questions_content_type_check
check (content_type in ('quiz', 'past_paper'));

update public.questions
set content_type = coalesce(
  (
    select lectures.content_type
    from public.lectures
    where lectures.id = public.questions.lecture_id
  ),
  'quiz'
)
where content_type is null or content_type = '';

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lecture_id uuid not null references public.lectures(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option text not null check (selected_option in ('a', 'b', 'c', 'd')),
  is_correct boolean not null default false,
  points_awarded integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, question_id)
);

create table if not exists public.question_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lecture_id uuid not null references public.lectures(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  message text not null,
  admin_reply text,
  answered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, question_id)
);

alter table public.question_reports add column if not exists admin_reply text;
alter table public.question_reports add column if not exists answered_at timestamptz;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select auth.jwt() ->> 'email' = '2007aan1@gmail.com';
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.recalculate_user_points(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set total_points = coalesce((
    select sum(points_awarded)
    from public.submissions
    where user_id = target_user_id
  ), 0)
  where id = target_user_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.stages enable row level security;
alter table public.blocks enable row level security;
alter table public.modules enable row level security;
alter table public.lectures enable row level security;
alter table public.questions enable row level security;
alter table public.submissions enable row level security;
alter table public.question_reports enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "stages_select_authenticated" on public.stages;
create policy "stages_select_authenticated"
on public.stages
for select
to authenticated
using (true);

drop policy if exists "stages_admin_all" on public.stages;
create policy "stages_admin_all"
on public.stages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "blocks_select_authenticated" on public.blocks;
create policy "blocks_select_authenticated"
on public.blocks
for select
to authenticated
using (true);

drop policy if exists "blocks_admin_all" on public.blocks;
create policy "blocks_admin_all"
on public.blocks
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "modules_select_authenticated" on public.modules;
create policy "modules_select_authenticated"
on public.modules
for select
to authenticated
using (true);

drop policy if exists "modules_admin_all" on public.modules;
create policy "modules_admin_all"
on public.modules
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "lectures_select_authenticated" on public.lectures;
create policy "lectures_select_authenticated"
on public.lectures
for select
to authenticated
using (true);

drop policy if exists "lectures_admin_all" on public.lectures;
create policy "lectures_admin_all"
on public.lectures
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "questions_select_authenticated" on public.questions;
create policy "questions_select_authenticated"
on public.questions
for select
to authenticated
using (true);

drop policy if exists "questions_admin_all" on public.questions;
create policy "questions_admin_all"
on public.questions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "submissions_select_own" on public.submissions;
create policy "submissions_select_own"
on public.submissions
for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "submissions_insert_own" on public.submissions;
create policy "submissions_insert_own"
on public.submissions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "submissions_update_own" on public.submissions;
create policy "submissions_update_own"
on public.submissions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "question_reports_select_own_or_admin" on public.question_reports;
create policy "question_reports_select_own_or_admin"
on public.question_reports
for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "question_reports_insert_own" on public.question_reports;
create policy "question_reports_insert_own"
on public.question_reports
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "question_reports_update_own" on public.question_reports;
create policy "question_reports_update_own"
on public.question_reports
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "question_reports_admin_delete" on public.question_reports;
create policy "question_reports_admin_delete"
on public.question_reports
for delete
to authenticated
using (public.is_admin());

drop policy if exists "question_reports_admin_update" on public.question_reports;
create policy "question_reports_admin_update"
on public.question_reports
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant execute on function public.recalculate_user_points(uuid) to authenticated;
grant execute on function public.is_admin() to authenticated;
