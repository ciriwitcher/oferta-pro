create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_name text,
  full_name text,
  created_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  client_email text,
  industry text,
  client_problem text not null,
  proposed_service text not null,
  status text not null default 'new'
    check (status in ('new', 'qualified', 'converted', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null,
  scope text,
  price numeric(12,2) check (price is null or price >= 0),
  delivery_time text,
  additional_information text,
  tone text check (tone is null or tone in ('formal', 'partner', 'sales')),
  status text not null default 'draft'
    check (status in ('draft', 'ready', 'sent', 'accepted', 'rejected', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offers_lead_user_fk
    foreign key (lead_id, user_id)
    references public.leads(id, user_id)
    on delete cascade
);

create index leads_user_id_idx on public.leads(user_id);
create index offers_user_id_idx on public.offers(user_id);
create index offers_lead_id_idx on public.offers(lead_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

create trigger offers_set_updated_at
before update on public.offers
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, company_name, full_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'company_name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.offers enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "leads_select_own"
on public.leads for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "leads_insert_own"
on public.leads for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "leads_update_own"
on public.leads for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "leads_delete_own"
on public.leads for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "offers_select_own"
on public.offers for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "offers_insert_own"
on public.offers for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "offers_update_own"
on public.offers for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "offers_delete_own"
on public.offers for delete
to authenticated
using ((select auth.uid()) = user_id);
