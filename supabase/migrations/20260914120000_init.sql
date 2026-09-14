-- =====================================================================
-- Hub STI - Esquema do banco de dados (Supabase / PostgreSQL)
--
-- Aplicado automaticamente pela integracao do Supabase com o GitHub, ou
-- manualmente colando este arquivo no SQL Editor. Pode rodar mais de uma
-- vez sem quebrar nada.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Pilares (Eficiencia Energetica, Lean, Transformacao Digital)
-- ---------------------------------------------------------------------
create table if not exists public.pillars (
  id          text primary key,
  name        text not null,
  short_name  text not null,
  sort_order  int  not null default 0
);

-- ---------------------------------------------------------------------
-- Perfis de usuario (1:1 com auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  email      text not null default '',
  role       text not null default 'member' check (role in ('admin', 'member')),
  pillar_id  text references public.pillars (id),
  phone      text,
  created_at timestamptz not null default now()
);

-- O primeiro usuario que se cadastrar vira admin automaticamente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_first boolean;
begin
  select count(*) = 0 into is_first from public.profiles;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    case when is_first then 'admin' else 'member' end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Ciclos
-- ---------------------------------------------------------------------
create table if not exists public.cycles (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  year       int  not null,
  start_date date not null,
  end_date   date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  constraint cycles_dates_check check (end_date >= start_date)
);

-- Apenas um ciclo pode estar marcado como "atual".
create unique index if not exists cycles_single_current
  on public.cycles (is_current) where is_current;

create index if not exists cycles_year_idx on public.cycles (year desc, start_date desc);

-- ---------------------------------------------------------------------
-- Metas anuais e metas por ciclo (uma para cada pilar)
-- ---------------------------------------------------------------------
create table if not exists public.annual_goals (
  year             int  not null,
  pillar_id        text not null references public.pillars (id) on delete cascade,
  target_companies int  not null default 0 check (target_companies >= 0),
  target_revenue   numeric(14, 2) not null default 0 check (target_revenue >= 0),
  updated_at       timestamptz not null default now(),
  primary key (year, pillar_id)
);

create table if not exists public.cycle_goals (
  cycle_id         uuid not null references public.cycles (id) on delete cascade,
  pillar_id        text not null references public.pillars (id) on delete cascade,
  target_companies int  not null default 0 check (target_companies >= 0),
  target_revenue   numeric(14, 2) not null default 0 check (target_revenue >= 0),
  updated_at       timestamptz not null default now(),
  primary key (cycle_id, pillar_id)
);

-- ---------------------------------------------------------------------
-- Empresas
-- ---------------------------------------------------------------------
create table if not exists public.companies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  cnpj          text,
  city          text,
  state         text,
  sector        text,
  contact_name  text,
  contact_email text,
  contact_phone text,
  notes         text,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists companies_name_idx on public.companies (lower(name));

-- ---------------------------------------------------------------------
-- Contratacoes / atendimentos (o que de fato conta para a meta)
--
-- Uma empresa pode ter VARIOS registros: um por pilar, por ciclo.
-- Assim, se o pessoal do Lean levar uma venda de Eficiencia Energetica,
-- cria-se um registro do pilar "Eficiencia Energetica" com
-- sourced_pillar_id = "lean". A meta de EE conta esse registro; a
-- origem fica registrada sem inflar o numero do Lean.
-- ---------------------------------------------------------------------
create table if not exists public.engagements (
  id                 uuid primary key default gen_random_uuid(),
  company_id         uuid not null references public.companies (id) on delete cascade,
  pillar_id          text not null references public.pillars (id),
  cycle_id           uuid not null references public.cycles (id) on delete cascade,
  status             text not null default 'prospeccao'
                     check (status in ('prospeccao', 'negociacao', 'contratada', 'execucao', 'finalizada', 'perdida')),
  owner_id           uuid references public.profiles (id) on delete set null,
  sourced_by_id      uuid references public.profiles (id) on delete set null,
  sourced_pillar_id  text references public.pillars (id),
  value              numeric(14, 2) not null default 0 check (value >= 0),
  contract_date      date,
  start_date         date,
  end_date           date,
  counts_toward_goal boolean not null default true,
  notes              text,
  -- Campos especificos de cada pilar (consumo kWh, horas de consultoria, etc).
  -- O formulario de cada pilar esta em src/lib/pillar-fields.ts.
  pillar_data        jsonb not null default '{}'::jsonb,
  position           int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- Impede contar a mesma empresa duas vezes no mesmo pilar e ciclo.
  constraint engagements_unique_per_cycle unique (company_id, pillar_id, cycle_id)
);

create index if not exists engagements_cycle_idx  on public.engagements (cycle_id);
create index if not exists engagements_pillar_idx on public.engagements (pillar_id);
create index if not exists engagements_status_idx on public.engagements (status);

-- ---------------------------------------------------------------------
-- Viagens
-- ---------------------------------------------------------------------
create table if not exists public.trips (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  destination text not null,
  start_date  date not null,
  end_date    date not null,
  description text,
  company_id  uuid references public.companies (id) on delete set null,
  cycle_id    uuid references public.cycles (id) on delete set null,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint trips_dates_check check (end_date >= start_date)
);

create index if not exists trips_start_idx on public.trips (start_date);

create table if not exists public.trip_participants (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (trip_id, user_id)
);

-- ---------------------------------------------------------------------
-- Arquivos compartilhados
-- ---------------------------------------------------------------------
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  storage_path text not null unique,
  mime_type    text,
  size_bytes   bigint not null default 0,
  description  text,
  visibility   text not null default 'all' check (visibility in ('all', 'specific')),
  cycle_id     uuid references public.cycles (id) on delete set null,
  company_id   uuid references public.companies (id) on delete set null,
  uploaded_by  uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists documents_created_idx on public.documents (created_at desc);

create table if not exists public.document_recipients (
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  primary key (document_id, user_id)
);

-- ---------------------------------------------------------------------
-- Ajustes para bases que ja foram criadas antes (seguro rodar sempre)
-- ---------------------------------------------------------------------
alter table public.engagements
  add column if not exists pillar_data jsonb not null default '{}'::jsonb;

-- =====================================================================
-- Funcoes auxiliares para as politicas de seguranca
-- =====================================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.can_see_document(doc_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1
    from public.documents d
    where d.id = doc_id
      and (
        d.visibility = 'all'
        or d.uploaded_by = auth.uid()
        or exists (
          select 1 from public.document_recipients r
          where r.document_id = d.id and r.user_id = auth.uid()
        )
      )
  );
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.pillars             enable row level security;
alter table public.profiles            enable row level security;
alter table public.cycles              enable row level security;
alter table public.annual_goals        enable row level security;
alter table public.cycle_goals         enable row level security;
alter table public.companies           enable row level security;
alter table public.engagements         enable row level security;
alter table public.trips               enable row level security;
alter table public.trip_participants   enable row level security;
alter table public.documents           enable row level security;
alter table public.document_recipients enable row level security;

-- Pilares: todos leem, admin edita -----------------------------------
drop policy if exists pillars_read on public.pillars;
create policy pillars_read on public.pillars
  for select to authenticated using (true);

drop policy if exists pillars_write on public.pillars;
create policy pillars_write on public.pillars
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Perfis: todos do time se enxergam ----------------------------------
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert to authenticated with check (id = auth.uid());

-- Ciclos e metas: todos leem, admin edita -----------------------------
drop policy if exists cycles_read on public.cycles;
create policy cycles_read on public.cycles
  for select to authenticated using (true);

drop policy if exists cycles_write on public.cycles;
create policy cycles_write on public.cycles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists annual_goals_read on public.annual_goals;
create policy annual_goals_read on public.annual_goals
  for select to authenticated using (true);

drop policy if exists annual_goals_write on public.annual_goals;
create policy annual_goals_write on public.annual_goals
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists cycle_goals_read on public.cycle_goals;
create policy cycle_goals_read on public.cycle_goals
  for select to authenticated using (true);

drop policy if exists cycle_goals_write on public.cycle_goals;
create policy cycle_goals_write on public.cycle_goals
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Empresas e contratacoes: o time inteiro colabora --------------------
drop policy if exists companies_read on public.companies;
create policy companies_read on public.companies
  for select to authenticated using (true);

drop policy if exists companies_insert on public.companies;
create policy companies_insert on public.companies
  for insert to authenticated with check (auth.uid() is not null);

drop policy if exists companies_update on public.companies;
create policy companies_update on public.companies
  for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists companies_delete on public.companies;
create policy companies_delete on public.companies
  for delete to authenticated using (created_by = auth.uid() or public.is_admin());

drop policy if exists engagements_read on public.engagements;
create policy engagements_read on public.engagements
  for select to authenticated using (true);

drop policy if exists engagements_insert on public.engagements;
create policy engagements_insert on public.engagements
  for insert to authenticated with check (auth.uid() is not null);

drop policy if exists engagements_update on public.engagements;
create policy engagements_update on public.engagements
  for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists engagements_delete on public.engagements;
create policy engagements_delete on public.engagements
  for delete to authenticated using (owner_id = auth.uid() or public.is_admin());

-- Viagens: todos veem (a ideia e justamente todos enxergarem) ---------
drop policy if exists trips_read on public.trips;
create policy trips_read on public.trips
  for select to authenticated using (true);

drop policy if exists trips_insert on public.trips;
create policy trips_insert on public.trips
  for insert to authenticated with check (created_by = auth.uid());

drop policy if exists trips_update on public.trips;
create policy trips_update on public.trips
  for update to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());

drop policy if exists trips_delete on public.trips;
create policy trips_delete on public.trips
  for delete to authenticated using (created_by = auth.uid() or public.is_admin());

drop policy if exists trip_participants_read on public.trip_participants;
create policy trip_participants_read on public.trip_participants
  for select to authenticated using (true);

drop policy if exists trip_participants_write on public.trip_participants;
create policy trip_participants_write on public.trip_participants
  for all to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and (t.created_by = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and (t.created_by = auth.uid() or public.is_admin())
    )
  );

-- Arquivos: "para todos" ou "para pessoas especificas" ----------------
drop policy if exists documents_read on public.documents;
create policy documents_read on public.documents
  for select to authenticated
  using (
    visibility = 'all'
    or uploaded_by = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.document_recipients r
      where r.document_id = id and r.user_id = auth.uid()
    )
  );

drop policy if exists documents_insert on public.documents;
create policy documents_insert on public.documents
  for insert to authenticated with check (uploaded_by = auth.uid());

drop policy if exists documents_update on public.documents;
create policy documents_update on public.documents
  for update to authenticated
  using (uploaded_by = auth.uid() or public.is_admin())
  with check (uploaded_by = auth.uid() or public.is_admin());

drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents
  for delete to authenticated using (uploaded_by = auth.uid() or public.is_admin());

drop policy if exists document_recipients_read on public.document_recipients;
create policy document_recipients_read on public.document_recipients
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.documents d
      where d.id = document_id and d.uploaded_by = auth.uid()
    )
  );

drop policy if exists document_recipients_write on public.document_recipients;
create policy document_recipients_write on public.document_recipients
  for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.documents d
      where d.id = document_id and d.uploaded_by = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.documents d
      where d.id = document_id and d.uploaded_by = auth.uid()
    )
  );

-- =====================================================================
-- Storage: bucket privado de arquivos
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

drop policy if exists documentos_read on storage.objects;
create policy documentos_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documentos'
    and exists (
      select 1 from public.documents d
      where d.storage_path = storage.objects.name
        and (
          d.visibility = 'all'
          or d.uploaded_by = auth.uid()
          or public.is_admin()
          or exists (
            select 1 from public.document_recipients r
            where r.document_id = d.id and r.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists documentos_insert on storage.objects;
create policy documentos_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'documentos');

drop policy if exists documentos_delete on storage.objects;
create policy documentos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documentos'
    and (
      owner = auth.uid()
      or public.is_admin()
    )
  );

-- =====================================================================
-- Dados iniciais
-- =====================================================================
insert into public.pillars (id, name, short_name, sort_order) values
  ('eficiencia_energetica', 'Eficiência Energética', 'Eficiência Energética', 1),
  ('lean',                  'Lean',                  'Lean',                 2),
  ('transformacao_digital', 'Transformação Digital', 'Transf. Digital',      3)
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  sort_order = excluded.sort_order;

-- =====================================================================
-- FICHA DE VISITA TÉCNICA — Eficiência Energética
-- Seções 1 a 4 são obrigatórias; da 5 em diante o consultor liga apenas
-- as que forem usar (enabled_sections).
-- =====================================================================
create table if not exists public.technical_visits (
  id               uuid primary key default gen_random_uuid(),
  engagement_id    uuid not null unique references public.engagements (id) on delete cascade,
  status           text not null default 'rascunho' check (status in ('rascunho', 'concluida')),
  visit_date       date,
  visit_number     text,
  consultant_name  text,
  -- ids das seções opcionais ligadas, ex.: ["s7","s8"]
  enabled_sections jsonb not null default '[]'::jsonb,
  -- respostas de todas as seções, uma chave por seção
  answers          jsonb not null default '{}'::jsonb,
  -- histórico de consumo dos 12 meses (seção 4)
  energy_months    jsonb not null default '[]'::jsonb,
  has_gd           boolean not null default false,
  gd_power_kwp     numeric(10, 2),
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists technical_visits_engagement_idx
  on public.technical_visits (engagement_id);

create table if not exists public.technical_visit_photos (
  id           uuid primary key default gen_random_uuid(),
  visit_id     uuid not null references public.technical_visits (id) on delete cascade,
  section_id   text not null,
  storage_path text not null unique,
  caption      text,
  position     int not null default 0,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists technical_visit_photos_visit_idx
  on public.technical_visit_photos (visit_id, section_id, position);

alter table public.technical_visits       enable row level security;
alter table public.technical_visit_photos enable row level security;

-- A equipe inteira enxerga e colabora nas fichas.
drop policy if exists technical_visits_read on public.technical_visits;
create policy technical_visits_read on public.technical_visits
  for select to authenticated using (true);

drop policy if exists technical_visits_insert on public.technical_visits;
create policy technical_visits_insert on public.technical_visits
  for insert to authenticated with check (auth.uid() is not null);

drop policy if exists technical_visits_update on public.technical_visits;
create policy technical_visits_update on public.technical_visits
  for update to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists technical_visits_delete on public.technical_visits;
create policy technical_visits_delete on public.technical_visits
  for delete to authenticated using (created_by = auth.uid() or public.is_admin());

drop policy if exists technical_visit_photos_read on public.technical_visit_photos;
create policy technical_visit_photos_read on public.technical_visit_photos
  for select to authenticated using (true);

drop policy if exists technical_visit_photos_insert on public.technical_visit_photos;
create policy technical_visit_photos_insert on public.technical_visit_photos
  for insert to authenticated with check (auth.uid() is not null);

drop policy if exists technical_visit_photos_update on public.technical_visit_photos;
create policy technical_visit_photos_update on public.technical_visit_photos
  for update to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists technical_visit_photos_delete on public.technical_visit_photos;
create policy technical_visit_photos_delete on public.technical_visit_photos
  for delete to authenticated using (created_by = auth.uid() or public.is_admin());

-- Bucket das fotos da ficha (privado, visível para a equipe logada)
insert into storage.buckets (id, name, public)
values ('ficha-fotos', 'ficha-fotos', false)
on conflict (id) do nothing;

drop policy if exists ficha_fotos_read on storage.objects;
create policy ficha_fotos_read on storage.objects
  for select to authenticated using (bucket_id = 'ficha-fotos');

drop policy if exists ficha_fotos_insert on storage.objects;
create policy ficha_fotos_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'ficha-fotos');

drop policy if exists ficha_fotos_delete on storage.objects;
create policy ficha_fotos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'ficha-fotos' and (owner = auth.uid() or public.is_admin()));
