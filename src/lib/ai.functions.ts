import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.7-flash";

/** Stream a gateway chat completion and accumulate the final text. */
async function callGateway(system: string, user: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured. Missing LOVABLE_API_KEY.");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 402 || res.status === 403) {
      throw new Error(
        "AI credits are unavailable for this workspace. Please add credits in Lovable to continue.",
      );
    }
    if (res.status === 429) {
      throw new Error("The AI service is busy right now. Please try again in a moment.");
    }
    throw new Error(`AI request failed (${res.status}). ${body.slice(0, 200)}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("AI service returned an empty stream.");

  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === "string") text += delta;
      } catch {
        // ignore malformed SSE chunk
      }
    }
  }

  if (!text.trim()) throw new Error("The AI returned an empty response. Please try again.");
  return text.trim();
}

const reviewInput = z.object({
  review: z.string().min(3, "Please paste a review or complaint first."),
  audience: z.enum(["Client", "Manager", "Team"]),
  tone: z.enum(["Formal Apology", "Informal/Friendly", "Persuasive/Promotional"]),
});

export const generateReviewResponse = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => reviewInput.parse(data))
  .handler(async ({ data }) => {
    const system = `You are the communications co-pilot for "Glossy Nails", an upscale nail salon. You write polished, empathetic, ready-to-send emails on behalf of the salon owner. Write in clean markdown with a clear subject line, greeting, body paragraphs, and a warm sign-off. Never invent policies like refunds unless reasonable for a salon; keep it realistic.`;
    const user = `Customer review / complaint:\n"""\n${data.review}\n"""\n\nWrite a complete email response addressed to the ${data.audience}. Tone: ${data.tone}. Tailor vocabulary, level of detail, and call-to-action to that audience. Return only the email (Subject line included), nothing else.`;
    return { result: await callGateway(system, user) };
  });

const planInput = z.object({
  staff: z.string().min(2, "List at least one staff member."),
  tasks: z.string().min(3, "List at least one high-priority task."),
  busyHours: z.string().min(1, "Enter the estimated busy hours."),
});

export const generateDailyPlan = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => planInput.parse(data))
  .handler(async ({ data }) => {
    const system = `You are the operations co-pilot for "Glossy Nails", an upscale nail salon. You produce realistic, structured daily schedules for salon teams. Format output in clean markdown with clear sections and time blocks.`;
    const user = `Plan today's salon day.\n\nAvailable staff members:\n${data.staff}\n\nHigh-priority tasks:\n${data.tasks}\n\nEstimated busy hours: ${data.busyHours}\n\nProduce a structured daily schedule (morning prep, client-flow blocks, task assignments per staff member by urgency, breaks, closing routine). You MUST include a dedicated section titled exactly "Time Optimization Strategy" with actionable advice for managing the peak/busy hours (staggering appointments, prep work timing, upsell moments, walk-in handling). Return only the schedule in markdown.`;
    return { result: await callGateway(system, user) };
  });

const trendInput = z.object({
  theme: z.string().min(3, "Enter a trend theme or client request."),
});

export const generateTrendInsights = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => trendInput.parse(data))
  .handler(async ({ data }) => {
    const system = `You are the trend research co-pilot for "Glossy Nails", an upscale nail salon. You analyze nail-art trend requests and turn them into actionable design guidance and marketing copy. Format output in clean markdown.`;
    const user = `Analyze this nail-art trend theme / client request: "${data.theme}"\n\nReturn markdown with exactly these three sections:\n## Aesthetic Summary — the visual elements, color palette, mood, and cultural references of the trend.\n## Technique & Material Recommendations — specific nail art techniques (e.g. chrome powder, airbrush, 3D gel charms, hand-painting) and materials to buy, with practical application tips.\n## Social Media Copy — 3 ready-to-post captions (Instagram/TikTok) with emojis and hashtags that a salon can use immediately to market this look.`;
    return { result: await callGateway(system, user) };
  });
