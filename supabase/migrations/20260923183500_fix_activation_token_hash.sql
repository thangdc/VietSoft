alter table public.activations
add column if not exists activation_token_hash text;

create unique index if not exists idx_activations_activation_token_hash
on public.activations (activation_token_hash);
