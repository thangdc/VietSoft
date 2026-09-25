insert into public.payment_products (product_code, plan_code, name, amount, currency, active)
values
    ('vietsoft-qr', 'monthly', 'VietSoft QR Pro - Monthly', 39000, 'VND', true),
    ('vietsoft-qr', 'annual', 'VietSoft QR Pro - Annual', 199000, 'VND', true)
on conflict (product_code, plan_code)
do update set
    name = excluded.name,
    amount = excluded.amount,
    currency = excluded.currency,
    active = excluded.active;
