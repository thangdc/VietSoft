create extension if not exists pgcrypto;

create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    name text not null,
    created_at timestamptz not null default now()
);

create table if not exists public.licenses (
    id uuid primary key default gen_random_uuid(),
    product_id uuid not null references public.products(id) on delete restrict,
    license_key_hash text not null unique,
    email text not null,
    plan text not null default 'pro',
    status text not null default 'active' check (status in ('active', 'revoked')),
    expires_at timestamptz,
    max_devices integer not null default 1 check (max_devices > 0),
    created_at timestamptz not null default now()
);

create table if not exists public.activations (
    id uuid primary key default gen_random_uuid(),
    license_id uuid not null references public.licenses(id) on delete cascade,
    device_id text not null,
    activation_token_hash text not null unique,
    activated_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),
    deactivated_at timestamptz,
    unique (license_id, device_id)
);

create index if not exists idx_licenses_product_id on public.licenses(product_id);
create index if not exists idx_licenses_email on public.licenses(email);
create index if not exists idx_licenses_expires_at on public.licenses(expires_at);
create index if not exists idx_activations_license_id on public.activations(license_id);
create index if not exists idx_activations_device_id on public.activations(device_id);

alter table public.products enable row level security;
alter table public.licenses enable row level security;
alter table public.activations enable row level security;

revoke all on public.products from anon, authenticated;
revoke all on public.licenses from anon, authenticated;
revoke all on public.activations from anon, authenticated;

insert into public.products (code, name)
values ('vietsoft-qr', 'VietSoft QR Code Generator')
on conflict (code) do nothing;
