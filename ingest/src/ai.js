// Gemini via Google AI Studio, server-side (no App Check / Play Integrity
// dependency — works on every install). Key: env.GEMINI_API_KEY.
import { corsHeaders } from "./reports.js";

const MODEL = "gemini-flash-lite-latest"; // ~1s vs ~16s for flash-latest
const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: corsHeaders({ "content-type": "application/json; charset=utf-8" }) });

export async function geminiGenerate(env, { system, contents, maxTokens = 400, temperature = 0.4, noThinking = false, model = MODEL }) {
  const cfg = { temperature, maxOutputTokens: maxTokens };
  // gemini-flash-latest (2.5) "thinks" first, eating tiny token budgets — kill
  // it for short deterministic tasks like classification.
  if (noThinking) cfg.thinkingConfig = { thinkingBudget: 0 };
  const body = { contents, generationConfig: cfg };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": env.GEMINI_API_KEY.trim(), "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`gemini ${r.status}: ${(await r.text()).slice(0, 120)}`);
  const j = await r.json();
  return (j.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
}

async function rateOk(env, request, cap = 40) {
  const ip = request.headers.get("cf-connecting-ip") || "0";
  const key = `air:${ip}`;
  const n = Number((await env.EWS_KV.get(key)) || 0);
  if (n >= cap) return false;
  try {
    await env.EWS_KV.put(key, String(n + 1), { expirationTtl: 3600 });
  } catch {} // counter is best-effort — don't kill the AI on write quota
  return true;
}

const LANG_NAME = {
  ar: "the user's language (Arabic or Algerian darija)",
  en: "English",
  fr: "French",
};

// POST /v1/ai/chat  { messages:[{role,text}], lang, context }
export async function handleChat(request, env) {
  if (!env.GEMINI_API_KEY) return json({ error: "ai disabled" }, 503);
  if (!(await rateOk(env, request))) return json({ error: "rate limit" }, 429);
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }
  const lang = ["fr", "ar", "en"].includes(b.lang) ? b.lang : "fr";
  const system =
    `You are the assistant of Rad Balek (رد بالك), an early-warning app for Algeria covering heatwaves, ` +
    `wildfires, floods, earthquakes, storms and road danger. Always answer in ${LANG_NAME[lang]}, briefly and ` +
    `clearly, with practical safety advice. For any real emergency, remind the user to call Protection Civile ` +
    `(14 or 1021). Never give a medical diagnosis. Stay strictly on safety, weather, hazards, first aid, and ` +
    `using the app; if asked something off-topic, gently steer back to safety. Be calm and reassuring, never ` +
    `alarmist.\n\nCurrent situation for this user:\n${String(b.context || "").slice(0, 1500)}`;
  const contents = (b.messages || [])
    .slice(-12)
    .map((m) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: String(m.text || "").slice(0, 1000) }] }));
  if (!contents.length) return json({ error: "no message" }, 400);
  try {
    const text = await geminiGenerate(env, { system, contents, maxTokens: 260, temperature: 0.4 });
    return json({ text });
  } catch (e) {
    return json({ error: String(e.message).slice(0, 160) }, 502);
  }
}

// POST /v1/ai/category  { text }  -> one category word
export async function handleCategory(request, env) {
  if (!env.GEMINI_API_KEY) return json({ error: "ai disabled" }, 503);
  if (!(await rateOk(env, request))) return json({ error: "rate limit" }, 429);
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }
  const text = String(b.text || "").slice(0, 280);
  if (text.trim().length < 4) return json({ category: null });
  try {
    const out = await geminiGenerate(env, {
      contents: [{ role: "user", parts: [{ text:
        `A citizen in Algeria describes a hazard (Arabic, darija or French): "${text}". ` +
        `Reply with EXACTLY one word matching the hazard: fire, smoke, road, flood, animal, heat, other.` }] }],
      maxTokens: 12,
      temperature: 0,
      noThinking: true,
    });
    const word = out.toLowerCase().replace(/[^a-z]/g, "");
    const cats = ["fire", "smoke", "road", "flood", "animal", "heat", "other"];
    return json({ category: cats.includes(word) ? word : null });
  } catch (e) {
    return json({ error: String(e.message).slice(0, 120) }, 502);
  }
}
