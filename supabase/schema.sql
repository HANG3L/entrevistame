-- Entrevistame: esquema de base de datos.
-- Pégalo en Supabase -> SQL Editor -> New query -> Run.

-- Perfil de cada usuario (se crea solo al entrar con Google por primera vez).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  level text check (level in ('junior', 'semi', 'senior')),
  cv_text text,
  cv_path text,
  updated_at timestamptz not null default now()
);

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_title text not null,
  level text,
  plan jsonb,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'en_curso', 'terminada')),
  created_at timestamptz not null default now()
);

create table if not exists public.turns (
  id bigint generated always as identity primary key,
  interview_id uuid not null references public.interviews (id) on delete cascade,
  role text not null check (role in ('ia', 'usuario')),
  content text not null,
  position int not null,
  question_id int,
  kind text check (kind in ('saludo', 'pregunta', 'repregunta', 'aclaracion', 'respuesta', 'despedida')),
  created_at timestamptz not null default now()
);

create index if not exists turns_interview_position_idx on public.turns (interview_id, position);

create table if not exists public.feedback (
  interview_id uuid primary key references public.interviews (id) on delete cascade,
  overall_score int check (overall_score between 0 and 100),
  competencies jsonb,
  strengths jsonb,
  improvements jsonb,
  per_question jsonb,
  created_at timestamptz not null default now()
);

-- Seguridad: cada usuario solo ve y modifica lo suyo.
alter table public.profiles enable row level security;
alter table public.interviews enable row level security;
alter table public.turns enable row level security;
alter table public.feedback enable row level security;

drop policy if exists "perfil propio" on public.profiles;
create policy "perfil propio" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "entrevistas propias" on public.interviews;
create policy "entrevistas propias" on public.interviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "turnos propios" on public.turns;
create policy "turnos propios" on public.turns
  for all using (
    exists (select 1 from public.interviews i where i.id = interview_id and i.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.interviews i where i.id = interview_id and i.user_id = auth.uid())
  );

drop policy if exists "feedback propio" on public.feedback;
create policy "feedback propio" on public.feedback
  for all using (
    exists (select 1 from public.interviews i where i.id = interview_id and i.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.interviews i where i.id = interview_id and i.user_id = auth.uid())
  );

-- Crea el perfil automáticamente con el nombre y la foto de Google.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Bucket privado para los PDF del CV. Cada usuario usa la carpeta con su id.
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

drop policy if exists "cv propio" on storage.objects;
create policy "cv propio" on storage.objects
  for all using (
    bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text
  );
