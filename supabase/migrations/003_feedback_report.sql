-- Fase 5: campos extra del feedback.
-- Pégalo en Supabase -> SQL Editor -> Run (solo una vez).

alter table public.feedback add column if not exists verdict text;
alter table public.feedback add column if not exists summary text;
alter table public.feedback add column if not exists next_steps jsonb;
