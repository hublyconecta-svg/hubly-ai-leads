-- Tabela de campanhas do usuário
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  query text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabela de leads gerados por campanhas
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  company_name text not null,
  website text,
  score numeric(4,1),
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Função genérica para updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers de updated_at
create trigger campaigns_set_updated_at
before update on public.campaigns
for each row
execute function public.set_updated_at();

create trigger leads_set_updated_at
before update on public.leads
for each row
execute function public.set_updated_at();

-- Habilitar RLS
alter table public.campaigns enable row level security;
alter table public.leads enable row level security;

-- Políticas de campanhas: usuário só vê e mexe nas próprias
create policy "Users can select own campaigns" on public.campaigns
for select
using (auth.uid() = user_id);

create policy "Users can insert own campaigns" on public.campaigns
for insert
with check (auth.uid() = user_id);

create policy "Users can update own campaigns" on public.campaigns
for update
using (auth.uid() = user_id);

create policy "Users can delete own campaigns" on public.campaigns
for delete
using (auth.uid() = user_id);

-- Políticas de leads: usuário só vê e mexe nos próprios
create policy "Users can select own leads" on public.leads
for select
using (auth.uid() = user_id);

create policy "Users can insert own leads" on public.leads
for insert
with check (auth.uid() = user_id);

create policy "Users can update own leads" on public.leads
for update
using (auth.uid() = user_id);

create policy "Users can delete own leads" on public.leads
for delete
using (auth.uid() = user_id);