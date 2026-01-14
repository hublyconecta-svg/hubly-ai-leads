import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { aiProvider, prompt } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body = {
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content:
            "Você é um(a) Product Manager sênior. Gere PRDs extremamente claros, bem estruturados e objetivos em português brasileiro, prontos para enviar para o time de produto e engenharia.",
        },
        {
          role: "user",
          content:
            `Ferramenta de IA selecionada: ${aiProvider || "não informado"}.\n\nUse esse contexto para gerar o melhor PRD possível:\n\n${prompt}`,
        },
      ],
      stream: false,
    } as const;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit atingido, tente novamente em alguns instantes." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de Lovable AI esgotados, adicione saldo para continuar." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "Erro ao chamar o gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const completion = await response.json();
    const content =
      completion?.choices?.[0]?.message?.content ||
      completion?.choices?.[0]?.delta?.content ||
      "";

    return new Response(JSON.stringify({ prd: content }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-prd error:", e);
    return new Response(
      JSON.stringify({
        error:
          e instanceof Error ? e.message : "Erro inesperado ao gerar PRD. Tente novamente mais tarde.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
