import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Body = {
  company_name: string;
  brief?: string;
  colors?: string;
  style?: string;
  variations?: number;
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
    const { company_name, brief, colors, style } = body;
    const variations = Math.max(1, Math.min(6, Number(body.variations ?? 3) || 3));

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

    const safeBrief = brief || `Logo moderna e profissional para ${company_name}.`;
    const safeColors = colors || "azul, branco, cinza escuro";
    const safeStyle = style || "minimalista, clean, focada em tipografia";

    const prompt = `Gere um conjunto de ${variations} propostas de logos em formato de imagem para a empresa abaixo.

Empresa: ${company_name}
Brief do logo: ${safeBrief}
Cores preferenciais: ${safeColors}
Estilo visual: ${safeStyle}

Requisitos:
- Estilo moderno e profissional para uma empresa de serviços.
- Fundo preferencialmente claro, com boa legibilidade.
- Evite texto pequeno demais.
- Não utilize marcas registradas ou imagens de terceiros.
- Responda apenas com imagens, sem texto adicional.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Erro Lovable AI (generate-logo-generic):", aiResponse.status, errorText);

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

      return new Response(JSON.stringify({ error: "Erro ao gerar logos" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const images = aiData.choices?.[0]?.message?.images as { image_url: { url: string } }[] | undefined;

    if (!images || images.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhuma imagem retornada pela IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = images
      .map((img, idx) => ({ url: img?.image_url?.url, variant_index: idx }))
      .filter((x) => typeof x.url === "string" && x.url.length > 0);

    return new Response(
      JSON.stringify({
        images: result,
        meta: {
          company_name,
          brief: safeBrief,
          colors: safeColors,
          style: safeStyle,
          variations,
          model: "google/gemini-2.5-flash-image",
          generated_at: new Date().toISOString(),
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro geral generate-logo-generic:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
