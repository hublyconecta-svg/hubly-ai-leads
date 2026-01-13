-- Adicionar coluna reasoning para armazenar a análise da IA
alter table public.leads
add column if not exists reasoning text;

-- Tabela para histórico de interações com leads
create table if not exists public.lead_interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null,
  type text not null, -- 'note', 'email', 'call', 'meeting'
  content text not null,
  created_at timestamptz not null default now()
);

-- Habilitar RLS na tabela de interações
alter table public.lead_interactions enable row level security;

-- Políticas de interações: usuário só vê e mexe nas próprias
create policy "Users can select own interactions" on public.lead_interactions
for select
using (auth.uid() = user_id);

create policy "Users can insert own interactions" on public.lead_interactions
for insert
with check (auth.uid() = user_id);

create policy "Users can update own interactions" on public.lead_interactions
for update
using (auth.uid() = user_id);

create policy "Users can delete own interactions" on public.lead_interactions
for delete
using (auth.uid() = user_id);