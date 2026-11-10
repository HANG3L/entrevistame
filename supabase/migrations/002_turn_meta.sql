-- Fase 3/4: datos extra en cada turno para seguir el avance de la entrevista.
-- Pégalo en Supabase -> SQL Editor -> Run (solo una vez).

alter table public.turns add column if not exists question_id int;
alter table public.turns add column if not exists kind text
  check (kind in ('saludo', 'pregunta', 'repregunta', 'aclaracion', 'respuesta', 'despedida'));

create index if not exists turns_interview_position_idx on public.turns (interview_id, position);
