import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead_id } = await req.json();

    if (!lead_id) {
      return new Response(
        JSON.stringify({ error: "lead_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Configurações de API não encontradas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar dados do lead
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gerar mensagem personalizada com Lovable AI
    console.log("Gerando mensagem personalizada para lead:", lead.company_name);
    
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
            content: `Você é um especialista em vendas B2B de websites e presença digital.

Sua missão é criar mensagens de abordagem personalizadas, persuasivas e profissionais para vender serviços de criação/modernização de websites.

REGRAS:
- Seja direto, profissional e empático
- Mencione o problema específico identificado (baseado no reasoning)
- Mostre como um website moderno pode resolver esse problema
- Use um tom consultivo, não agressivo
- Inclua uma chamada para ação clara
- Máximo de 3 parágrafos curtos
- Adequado para email, WhatsApp ou LinkedIn

ESTRUTURA:
1. Abertura personalizada mencionando a empresa
2. Identificação do problema/oportunidade
3. Proposta de valor e call-to-action`,
          },
          {
            role: "user",
            content: `Crie uma mensagem de vendas para:

Empresa: ${lead.company_name}
Website atual: ${lead.website || "Não tem website próprio"}
Score de oportunidade: ${lead.score}/10
Análise da oportunidade: ${lead.reasoning || "Empresa identificada como oportunidade"}

Crie uma mensagem persuasiva e personalizada focada em vender criação/modernização de website.`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Erro Lovable AI:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos na sua conta Lovable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao gerar mensagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const message = aiData.choices?.[0]?.message?.content;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Mensagem não gerada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Salvar a mensagem como uma interação
    const { error: insertError } = await supabase.from("lead_interactions").insert({
      lead_id,
      user_id: lead.user_id,
      type: "note",
      content: `📧 Mensagem gerada pela IA:\n\n${message}`,
    });

    if (insertError) {
      console.error("Erro ao salvar mensagem:", insertError);
    }

    return new Response(
      JSON.stringify({ message }),
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
