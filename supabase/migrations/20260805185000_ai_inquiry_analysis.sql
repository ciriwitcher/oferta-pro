alter table public.offers
  add column if not exists ai_analysis jsonb;

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model text not null,
  input_characters integer not null check (input_characters >= 0),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  input_tokens integer,
  output_tokens integer,
  error_code text,
  created_at timestamptz not null default now()
);

create index if not exists ai_generations_user_created_idx
  on public.ai_generations (user_id, created_at desc);

alter table public.ai_generations enable row level security;

drop policy if exists "ai_generations_select_own" on public.ai_generations;
create policy "ai_generations_select_own"
on public.ai_generations
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "ai_generations_insert_own" on public.ai_generations;
create policy "ai_generations_insert_own"
on public.ai_generations
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "ai_generations_update_own" on public.ai_generations;
create policy "ai_generations_update_own"
on public.ai_generations
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update on public.ai_generations to authenticated;
