-- Preserve client-side updated_at timestamps for last-write-wins sync.
-- The sync engine compares timestamps from each device, so the database trigger
-- must not replace updated_at with server time on every update.
drop trigger if exists qr_items_updated_at on public.qr_items;
drop function if exists public.set_qr_items_updated_at();
