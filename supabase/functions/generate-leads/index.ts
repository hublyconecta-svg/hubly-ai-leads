import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SerperResult {
  title: string;
  link: string;
  snippet?: string;
}

interface LeadAnalysis {
  score: number;
  company_name: string;
  reasoning: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaign_id, query } = await req.json();

    if (!campaign_id || !query) {
      return new Response(
        JSON.stringify({ error: "campaign_id e query são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SERPER_API_KEY || !LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Configurações de API não encontradas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Buscar empresas usando Serper API
    console.log("Buscando empresas com Serper...", query);
    const serperResponse = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: 10, // Buscar até 10 resultados
      }),
    });

    if (!serperResponse.ok) {
      const errorText = await serperResponse.text();
      console.error("Erro Serper:", serperResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar resultados" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serperData = await serperResponse.json();
    const results: SerperResult[] = serperData.organic || [];

    if (results.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum resultado encontrado", leads_created: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Encontrados ${results.length} resultados, qualificando com IA...`);

    // 2. Inicializar Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Obter user_id da campanha
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("user_id")
      .eq("id", campaign_id)
      .single();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: "Campanha não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user_id = campaign.user_id;

    // 3. Para cada resultado, usar Lovable AI para qualificar
    const leadsToInsert = [];

    for (const result of results) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: `Você é um especialista em qualificação de leads B2B. Analise o resultado de busca e atribua um score de 0 a 10 baseado em:
- Relevância do negócio para a busca
- Clareza das informações
- Potencial como lead de vendas
Retorne APENAS um JSON válido no formato: {"score": número, "company_name": "nome", "reasoning": "breve explicação"}`,
              },
              {
                role: "user",
                content: `Qualifique este resultado:
Título: ${result.title}
URL: ${result.link}
Descrição: ${result.snippet || "Sem descrição"}

Query original: ${query}`,
              },
            ],
            temperature: 0.3,
          }),
        });

        if (!aiResponse.ok) {
          console.error(`Erro AI para ${result.link}:`, aiResponse.status);
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;

        if (!content) {
          console.error(`Sem resposta AI para ${result.link}`);
          continue;
        }

        // Extrair JSON da resposta
        let analysis: LeadAnalysis;
        try {
          // Tentar parsear direto
          analysis = JSON.parse(content);
        } catch {
          // Se falhar, tentar extrair JSON de markdown
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          } else {
            console.error(`Resposta AI inválida para ${result.link}:`, content);
            continue;
          }
        }

        leadsToInsert.push({
          user_id,
          campaign_id,
          company_name: analysis.company_name || result.title,
          website: result.link,
          score: Math.min(10, Math.max(0, analysis.score)),
          status: analysis.score >= 7 ? "qualified" : "new",
        });
      } catch (error) {
        console.error(`Erro ao processar ${result.link}:`, error);
        continue;
      }
    }

    // 4. Inserir leads no banco
    if (leadsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("leads").insert(leadsToInsert);

      if (insertError) {
        console.error("Erro ao inserir leads:", insertError);
        return new Response(
          JSON.stringify({ error: "Erro ao salvar leads" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        message: "Leads gerados com sucesso",
        leads_created: leadsToInsert.length,
        total_results: results.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
