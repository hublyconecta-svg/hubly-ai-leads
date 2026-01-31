
Objetivo
- Tirar “Motor próprio” e “Gerador de logos” de dentro do detalhe do Lead (/leads/:id) e colocar como itens fixos no menu lateral (sidebar), acessíveis para usuários normalmente.
- Como você escolheu “Ferramentas sem lead”: as telas vão funcionar sem depender de lead_id e sem precisar estar dentro de /leads/:id.

O que existe hoje (diagnóstico rápido)
- “Motor próprio” e “Gerador de logos” hoje estão implementados como Tabs dentro de `src/pages/LeadDetails.tsx`.
- As Edge Functions atuais:
  - `generate-site-from-lead` exige `lead_id` e salva em `lead_sites`.
  - `generate-logo` exige `lead_id` e salva em `lead_logos` + Storage `lead-logos`.
- Então, para virar “sem lead”, precisamos de endpoints “genéricos” (novas edge functions) ou refatorar as atuais para aceitar modo sem lead (mais arriscado porque pode quebrar fluxo existente).

Decisão técnica (para não quebrar nada e manter simples)
- Criar 2 novas páginas:
  - `src/pages/MotorProprio.tsx` (gerador de landing page sem lead)
  - `src/pages/GeradorLogos.tsx` (gerador de logos sem lead)
- Criar 2 novas edge functions (genéricas, sem lead_id), reaproveitando a lógica/prompt:
  - `supabase/functions/generate-site/index.ts` (recebe: company_name, website?, goal, tone, primary_color, sections; retorna {html, css})
  - `supabase/functions/generate-logo-generic/index.ts` (recebe: company_name, brief?, colors?, style?, variations?; retorna imagens (dataURL) e opcionalmente metadados)
- Atualizar rotas e sidebar:
  - Rotas novas no `src/App.tsx`
  - Itens novos no `src/components/AppSidebar.tsx`
- Remover (ou ocultar) as Tabs “Motor próprio” e “Gerador de logos” do `LeadDetails.tsx` para não ficar duplicado (como você pediu “ao invés de … ser dentro dos leads”).

Fluxo final para o usuário (UX)
1) Sidebar terá:
   - Dashboard
   - Campanhas
   - Leads
   - Motor Próprio
   - Gerador de Logos
   - PRD Prompt
   - Configurações
2) Motor Próprio (sem lead):
   - Inputs: Nome da empresa, Site (opcional), Objetivo, Tom, Cor primária, Seções
   - Botão “Gerar”
   - Preview em iframe + botão “Baixar HTML”
3) Gerador de Logos (sem lead):
   - Inputs: Nome da empresa, Brief, Cores, Estilo, Variações
   - Botão “Gerar”
   - Grid com as imagens geradas + botões “Baixar PNG”
   - Sem precisar de lead

Detalhamento das mudanças (por arquivo)

1) Rotas
Arquivo: `src/App.tsx`
- Adicionar imports das novas páginas.
- Criar duas rotas protegidas (RequireAuth + AuthenticatedLayout), seguindo o padrão existente:
  - /motor-proprio
  - /gerador-logos

2) Sidebar
Arquivo: `src/components/AppSidebar.tsx`
- Adicionar dois itens no array `items` (para todos usuários, não-admin):
  - { title: "Motor Próprio", url: "/motor-proprio", icon: (ex: Globe ou LayoutTemplate) }
  - { title: "Gerador de Logos", url: "/gerador-logos", icon: (ex: Image ou Palette) }
- Ajustar `isActive()` para marcar ativo quando estiver nesses paths (padrão atual já cobre igualdade; pode manter simples).
- Manter o “Super Admin” como está (condicional).

3) Páginas novas (UI)
Arquivos novos:
- `src/pages/MotorProprio.tsx`
- `src/pages/GeradorLogos.tsx`

MotorProprio.tsx
- Reaproveitar componentes e lógica do trecho existente de “Motor próprio” em `LeadDetails.tsx`:
  - estados: goal, tone, primaryColor, sections, html/css
  - geração via `useMutation` chamando `supabase.functions.invoke("generate-site", { body: {...} })`
  - preview via `<iframe srcDoc={fullHtml} />` (ou componente existente se já houver)
  - download: mesma lógica do `handleDownloadSite`, mas com filename baseado em company_name.
- UI: Card com formulário + Card com preview + botões.

GeradorLogos.tsx
- Reaproveitar padrões de toast e loading.
- `useMutation` chamando `supabase.functions.invoke("generate-logo-generic", { body: {...} })`
- Renderizar imagens retornadas (data URL).
- “Baixar”:
  - Converter dataURL em Blob e usar `URL.createObjectURL` para download.
- Observação: como não vamos salvar em Storage por padrão, fica rápido e simples. Se depois você quiser “histórico”, a gente adiciona persistência.

4) Remover das Tabs do LeadDetails (para ficar “ao invés de”)
Arquivo: `src/pages/LeadDetails.tsx`
- No `<TabsList>` remover:
  - `<TabsTrigger value="motor-proprio">Motor próprio</TabsTrigger>`
  - `<TabsTrigger value="gerador-logos">Gerador de logos</TabsTrigger>`
- Remover também os `<TabsContent>` correspondentes (onde hoje ficam os formulários e previews).
- Remover estados e hooks que virarem “não usados”:
  - siteHtml/siteCss/siteGoal/siteTone/primaryColor/sections
  - logoBrief/logoColors/logoStyle/generatedLogos/isGeneratingLogos e query `lead-logos`
  - mutations `generateSite` e geração de logos (se existirem mais abaixo)
- Manter tudo que é “Resumo” (status, mensagens, interações) intacto.

5) Edge Functions novas (sem lead)
Arquivos novos:
- `supabase/functions/generate-site/index.ts`
  - Similar ao `generate-site-from-lead`, mas:
    - Não busca lead no banco
    - Prompt usa `company_name` e `website` informados
    - Retorna {html, css}
    - Não insere em `lead_sites`
- `supabase/functions/generate-logo-generic/index.ts`
  - Similar ao `generate-logo`, mas:
    - Não busca lead
    - Prompt usa company_name + brief/colors/style
    - Retorna as imagens como data URL (sem upload em Storage e sem inserir em `lead_logos`)
  - Importante: tratar `variations` com limite (ex: min 1, max 6) para evitar payload gigante.

6) Deploy de edge functions
- Depois de criar os arquivos, fazer deploy das novas functions:
  - generate-site
  - generate-logo-generic
- Garantir que os secrets necessários existem (LOVABLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). Para essas duas novas, tecnicamente o service role nem é necessário se não for acessar DB/Storage; mas podemos manter só LOVABLE_API_KEY (e remover dependência do service role), deixando mais seguro e simples.

Tratamento de erros e mensagens (importante para evitar “não funciona”)
- Em ambas páginas:
  - Validar campos mínimos:
    - Motor Próprio: company_name obrigatório
    - Logos: company_name obrigatório
  - Toast claro em:
    - 429 (rate limit)
    - 402 (sem créditos)
    - 500 (erro genérico)
- Loading state nos botões para travar duplo clique.

Testes manuais (checklist)
1) Sidebar:
   - Verificar que os itens aparecem para usuário normal.
   - Clicar e navegar para /motor-proprio e /gerador-logos sem erro.
2) Motor Próprio:
   - Gerar com company_name apenas.
   - Gerar com company_name + website.
   - Preview renderiza.
   - Download gera um .html válido.
3) Gerador de Logos:
   - Gerar com variações 3.
   - Download de cada PNG funciona.
4) LeadDetails:
   - Verificar que as tabs antigas sumiram.
   - “Resumo”, mensagens e interações continuam funcionando.

Riscos / Observações
- Retornar imagens em dataURL pode ser pesado. Por isso:
  - Limitar variações
  - Mostrar aviso se o usuário escolher muitas
- Se você quiser persistência (histórico), a gente adiciona depois (tabela + storage), mas não é necessário para o objetivo “só colocar na sidebar e usar”.

Entrega (o que você vai ver ao final)
- Dois novos itens na sidebar.
- Duas telas dedicadas (sem lead).
- LeadDetails mais limpo (sem “Motor próprio” e “Gerador de logos” lá dentro).
- Duas edge functions novas para suportar o modo sem lead, sem mexer nas atuais (menos chance de quebrar o que já existe).
