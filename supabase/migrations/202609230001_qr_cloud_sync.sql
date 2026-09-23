-- VietSoft QR Cloud Sync
-- Apply this migration in the VietSoft Supabase project.

create table if not exists public.qr_items (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    history_id text not null,
    type text not null,
    fields jsonb not null default '{}'::jsonb,
    data text not null default '',
    design jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz null,
    unique (user_id, history_id)
);

create index if not exists qr_items_user_updated_idx
    on public.qr_items (user_id, updated_at desc);

alter table public.qr_items enable row level security;

drop policy if exists "Users can read their QR items" on public.qr_items;
create policy "Users can read their QR items"
    on public.qr_items for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert their QR items" on public.qr_items;
create policy "Users can insert their QR items"
    on public.qr_items for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update their QR items" on public.qr_items;
create policy "Users can update their QR items"
    on public.qr_items for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Users can delete their QR items" on public.qr_items;
create policy "Users can delete their QR items"
    on public.qr_items for delete
    using (auth.uid() = user_id);

create or replace function public.set_qr_items_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists qr_items_updated_at on public.qr_items;
create trigger qr_items_updated_at
before update on public.qr_items
for each row execute function public.set_qr_items_updated_at();
