alter table public.profiles
  add column if not exists provider_type text not null default 'freelancer',
  add column if not exists contact_email text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists tax_id text,
  add column if not exists address text,
  add column if not exists bank_account text,
  add column if not exists logo_url text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
  drop constraint if exists profiles_provider_type_check;

alter table public.profiles
  add constraint profiles_provider_type_check
  check (provider_type in ('freelancer', 'company'));

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'provider-logos',
  'provider-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "provider_logos_insert_own" on storage.objects;
create policy "provider_logos_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'provider-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "provider_logos_update_own" on storage.objects;
create policy "provider_logos_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'provider-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'provider-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "provider_logos_delete_own" on storage.objects;
create policy "provider_logos_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'provider-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
