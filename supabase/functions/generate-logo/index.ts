import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateLogoRequestBody {
  lead_id: string;
  brief?: string;
  colors?: string;
  style?: string;
  variations?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as GenerateLogoRequestBody;
    const { lead_id, brief, colors, style, variations = 3 } = body;

    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Configurações de API não encontradas" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Buscar lead para garantir que existe e obter user_id
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, company_name, user_id")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(JSON.stringify({ error: "Lead não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeBrief =
      brief ||
      `Logo profissional para a clínica ${lead.company_name}, transmitindo confiança, tecnologia e cuidado com o sorriso.`;
    const safeColors = colors || "azul, branco, cinza escuro";
    const safeStyle = style || "minimalista, clean, focada em tipografia";

    const prompt = `Gere um conjunto de ${variations} propostas de logos em formato de imagem para a empresa abaixo.

Empresa: ${lead.company_name}
Brief do logo: ${safeBrief}
Cores preferenciais: ${safeColors}
Estilo visual: ${safeStyle}

Requisitos:
- Estilo moderno e profissional para uma clínica ou empresa de serviços.
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
      console.error("Erro Lovable AI (generate-logo):", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos na sua conta Lovable." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(JSON.stringify({ error: "Erro ao gerar logos" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const images = aiData.choices?.[0]?.message?.images as
      | { image_url: { url: string } }[]
      | undefined;

    if (!images || images.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhuma imagem retornada pela IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uploadResults: { url: string; variant_index: number }[] = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const dataUrl = image?.image_url?.url;
      if (!dataUrl || !dataUrl.startsWith("data:")) continue;

      const [meta, base64Data] = dataUrl.split(",", 2);
      const mimeMatch = meta.match(/data:(.*);base64/);
      const contentType = mimeMatch?.[1] || "image/png";

      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let j = 0; j < binary.length; j++) {
        bytes[j] = binary.charCodeAt(j);
      }

      const filePath = `${lead.user_id}/${lead_id}/${Date.now()}-${i}.png`;
      const { error: uploadError } = await supabase.storage
        .from("lead-logos")
        .upload(filePath, bytes, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error("Erro ao fazer upload do logo:", uploadError.message);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("lead-logos").getPublicUrl(filePath);

      uploadResults.push({ url: publicUrl, variant_index: i });
    }

    if (uploadResults.length === 0) {
      return new Response(JSON.stringify({ error: "Falha ao salvar logos gerados" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meta = {
      brief: safeBrief,
      colors: safeColors,
      style: safeStyle,
      model: "google/gemini-2.5-flash-image",
      generated_at: new Date().toISOString(),
    };

    const { data: logoRow, error: insertError } = await supabase
      .from("lead_logos")
      .insert({
        lead_id,
        user_id: lead.user_id,
        images: uploadResults,
        meta,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erro ao salvar lead_logos:", insertError.message);
      return new Response(JSON.stringify({ error: "Erro ao salvar logos gerados" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ lead_logo: logoRow }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro geral generate-logo:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
