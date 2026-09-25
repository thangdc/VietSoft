alter table public.licenses
    add column if not exists payment_id uuid references public.payments(id) on delete restrict;

create unique index if not exists ux_licenses_payment_id
    on public.licenses(payment_id)
    where payment_id is not null;

create index if not exists idx_licenses_payment_id on public.licenses(payment_id);
