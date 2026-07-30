create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_name text,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  client_email text,
  industry text,
  client_problem text not null,
  proposed_service text not null,
  status text not null default 'new' check (status in ('new', 'active', 'won', 'lost', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_id_user_id_unique unique (id, user_id)
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null,
  scope text,
  price numeric(12, 2) check (price is null or price >= 0),
  delivery_time text,
  additional_information text,
  tone text check (tone is null or tone in ('formal', 'partner', 'sales')),
  status text not null default 'draft' check (
    status in ('draft', 'ready', 'sent', 'accepted', 'rejected', 'archived')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offers_lead_owner_fkey
    foreign key (lead_id, user_id)
    references public.leads(id, user_id)
    on delete cascade
);

create index if not exists leads_user_id_idx on public.leads(user_id);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists offers_user_id_idx on public.offers(user_id);
create index if not exists offers_lead_id_idx on public.offers(lead_id);
create index if not exists offers_status_idx on public.offers(status);
create index if not exists offers_created_at_idx on public.offers(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

drop trigger if exists set_offers_updated_at on public.offers;
create trigger set_offers_updated_at
before update on public.offers
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, company_name, full_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'company_name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.offers enable row level security;

revoke all on public.profiles from anon;
revoke all on public.leads from anon;
revoke all on public.offers from anon;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.leads to authenticated;
grant select, insert, update, delete on public.offers to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "leads_select_own" on public.leads;
create policy "leads_select_own"
on public.leads
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "leads_insert_own" on public.leads;
create policy "leads_insert_own"
on public.leads
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "leads_update_own" on public.leads;
create policy "leads_update_own"
on public.leads
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "leads_delete_own" on public.leads;
create policy "leads_delete_own"
on public.leads
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "offers_select_own" on public.offers;
create policy "offers_select_own"
on public.offers
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "offers_insert_own" on public.offers;
create policy "offers_insert_own"
on public.offers
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.leads
    where leads.id = offers.lead_id
      and leads.user_id = (select auth.uid())
  )
);

drop policy if exists "offers_update_own" on public.offers;
create policy "offers_update_own"
on public.offers
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.leads
    where leads.id = offers.lead_id
      and leads.user_id = (select auth.uid())
  )
);

drop policy if exists "offers_delete_own" on public.offers;
create policy "offers_delete_own"
on public.offers
for delete
to authenticated
using ((select auth.uid()) = user_id);
