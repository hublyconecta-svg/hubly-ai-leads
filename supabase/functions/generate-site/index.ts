import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Body = {
  company_name: string;
  website?: string;
  goal?: string;
  tone?: string;
  primary_color?: string;
  sections?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as Body;
    const { company_name, website, goal, tone, primary_color, sections } = body;

    if (!company_name?.trim()) {
      return new Response(JSON.stringify({ error: "company_name é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Configurações de API não encontradas" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um designer e desenvolvedor front-end especialista em landing pages B2B para venda de serviços digitais.

Gere APENAS um JSON válido com o seguinte formato exato (sem texto extra, sem comentários, sem markdown):
{
  "html": "...markup dentro da <body>...",
  "css": "...estilos CSS completos..."
}

Regras:
- O HTML deve conter apenas o conteúdo da <body>, sem <html>, <head> ou <body>.
- Use HTML sem frameworks (sem Tailwind, sem Bootstrap), apenas tags e classes.
- O CSS deve ser completo e pronto para uso, incluindo estilos responsivos (mobile-first).
- Não use JavaScript.
- Texto em português do Brasil.`;

    const userPrompt = `Gere uma landing page institucional para:

Empresa: ${company_name}
Website atual (se houver): ${website || "(não informado)"}

Objetivo principal do site: ${goal || "Gerar mais leads para serviços digitais"}
Tom de voz desejado: ${tone || "Profissional e consultivo"}
Cor primária (hex): ${primary_color || "#3b82f6"}
Seções desejadas: ${sections || "Hero, Sobre, Serviços, Depoimentos, Contato"}

Lembre-se: responda SOMENTE com o JSON no formato solicitado, sem texto antes ou depois.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Erro Lovable AI (generate-site):", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos na sua conta Lovable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify({ error: "Erro ao gerar site" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content as string | undefined;

    if (!content) {
      return new Response(JSON.stringify({ error: "Resposta da IA vazia" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (_) {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) {
        return new Response(JSON.stringify({ error: "A IA não retornou um JSON válido" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      parsed = JSON.parse(match[0]);
    }

    const html = parsed?.html;
    const css = parsed?.css;
    if (!html || !css) {
      return new Response(JSON.stringify({ error: "Layout incompleto: html/css ausentes" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ html, css }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro geral generate-site:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
