create table if not exists public.payment_products (
    id uuid primary key default gen_random_uuid(),
    product_code text not null,
    plan_code text not null,
    name text not null,
    amount bigint not null check (amount > 0),
    currency text not null default 'VND',
    active boolean not null default true,
    created_at timestamptz not null default now(),
    unique (product_code, plan_code)
);

create table if not exists public.payments (
    id uuid primary key default gen_random_uuid(),
    provider text not null,
    provider_order_id text not null,
    product_code text not null,
    plan_code text not null,
    email text not null,
    amount bigint not null check (amount > 0),
    currency text not null default 'VND',
    status text not null default 'pending'
        check (status in ('pending', 'paid', 'failed', 'expired')),
    provider_transaction_id text,
    qr_code text,
    order_url text,
    metadata jsonb not null default '{}'::jsonb,
    provider_response jsonb,
    paid_at timestamptz,
    expires_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (provider, provider_order_id)
);

create table if not exists public.payment_events (
    id uuid primary key default gen_random_uuid(),
    payment_id uuid references public.payments(id) on delete set null,
    provider text not null,
    event_type text not null,
    event_key text,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_payment_products_lookup on public.payment_products(product_code, plan_code, active);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_payments_email on public.payments(email);
create index if not exists idx_payments_provider_order on public.payments(provider, provider_order_id);
create index if not exists idx_payment_events_payment_id on public.payment_events(payment_id);

alter table public.payment_products enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;

revoke all on public.payment_products from anon, authenticated;
revoke all on public.payments from anon, authenticated;
revoke all on public.payment_events from anon, authenticated;

insert into public.payment_products (product_code, plan_code, name, amount)
values
    ('vietsoft-qr', 'monthly', 'VietSoft QR Pro Monthly', 39000),
    ('vietsoft-qr', 'annual', 'VietSoft QR Pro Annual', 199000)
on conflict (product_code, plan_code) do update
set name = excluded.name, amount = excluded.amount, currency = excluded.currency, active = true;

create or replace function public.set_payment_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
before update on public.payments
for each row execute function public.set_payment_updated_at();
