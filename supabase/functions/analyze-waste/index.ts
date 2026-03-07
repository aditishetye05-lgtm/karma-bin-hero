import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image, barcode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userContent = barcode
      ? [{ type: "text", text: `Classify this waste item based on its barcode: ${barcode}. Identify what product this barcode belongs to and classify it.` }]
      : [
          { type: "text", text: "Classify this waste item with full structured details:" },
          { type: "image_url", image_url: { url: image } }
        ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are a waste classification AI for Goa, India. ${barcode ? "Look up the barcode to identify the product, then classify its packaging/material as waste." : "Analyze the image and return structured classification data."}

Classify the item into exactly one category: Paper, Wet, Plastic, Glass, Metal, or E-waste.
Identify the specific item type (e.g. "PET bottle", "newspaper", "banana peel").
Identify the primary material (e.g. "PET plastic", "cardboard", "organic matter", "aluminium").
Assess recyclability: "recyclable", "compostable", "non-recyclable", or "special-handling".
Provide a confidence score from 0.0 to 1.0.
Determine if cleaning is needed (food residue, contamination).
Give a disposal recommendation specific to Goa's waste system (Blue bin for dry recyclables, Green bin for wet/organic).`
          },
          {
            role: "user",
            content: userContent
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_waste",
              description: "Classify a waste item with structured fields",
              parameters: {
                type: "object",
                properties: {
                  category: { type: "string", enum: ["Paper", "Wet", "Plastic", "Glass", "Metal", "E-waste"] },
                  item_name: { type: "string", description: "Short description of the item" },
                  item_type: { type: "string", description: "Specific item type e.g. PET bottle, newspaper" },
                  material: { type: "string", description: "Primary material e.g. PET plastic, cardboard" },
                  recyclability: { type: "string", enum: ["recyclable", "compostable", "non-recyclable", "special-handling"] },
                  confidence: { type: "number", description: "Confidence score 0.0-1.0" },
                  needs_cleaning: { type: "boolean" },
                  cleaning_instructions: { type: "string" },
                  disposal_recommendation: { type: "string", description: "Region-specific disposal advice for Goa" }
                },
                required: ["category", "item_name", "item_type", "material", "recyclability", "confidence", "needs_cleaning", "disposal_recommendation"],
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
