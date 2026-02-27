import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a waste classification AI. Analyze the image and classify the item into exactly one category: Paper, Wet, Plastic, Glass, Metal, or E-waste.

Also determine if the item needs cleaning (has food residue, is dirty, or is mixed with other waste).

Respond with ONLY valid JSON in this exact format:
{
  "category": "Paper|Wet|Plastic|Glass|Metal|E-waste",
  "item_name": "short description of the item",
  "needs_cleaning": true|false,
  "cleaning_instructions": "instructions if needs_cleaning is true, otherwise null"
}`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Classify this waste item:" },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_waste",
              description: "Classify a waste item",
              parameters: {
                type: "object",
                properties: {
                  category: { type: "string", enum: ["Paper", "Wet", "Plastic", "Glass", "Metal", "E-waste"] },
                  item_name: { type: "string" },
                  needs_cleaning: { type: "boolean" },
                  cleaning_instructions: { type: "string" }
                },
                required: ["category", "item_name", "needs_cleaning"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "classify_waste" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try parsing content
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return new Response(jsonMatch[0], {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Could not parse AI response");
  } catch (e) {
    console.error("analyze-waste error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
