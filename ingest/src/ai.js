// Gemini via Google AI Studio, server-side (no App Check / Play Integrity
// dependency — works on every install). Key: env.GEMINI_API_KEY.
import { corsHeaders } from "./reports.js";
import { adminAuthed } from "./auth.js";

const MODEL = "gemini-flash-lite-latest"; // ~1s vs ~16s for flash-latest
const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: corsHeaders({ "content-type": "application/json; charset=utf-8" }) });

export async function geminiGenerate(env, { system, contents, maxTokens = 400, temperature = 0.4, noThinking = false, model = MODEL }) {
  const cfg = { temperature, maxOutputTokens: maxTokens };
  // gemini-flash-latest (2.5) "thinks" first, eating tiny token budgets — kill
  // it for short deterministic tasks like classification. BUT the LITE models
  // hard-reject thinkingBudget:0 with a 400 (see TECHNICAL.md §5.9), so only
  // send it for full-flash models. noThinking:true stays as the intent marker;
  // the model check here is the guard.
  if (noThinking && !/lite/i.test(model)) cfg.thinkingConfig = { thinkingBudget: 0 };
  const body = { contents, generationConfig: cfg };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": env.GEMINI_API_KEY.trim(), "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`gemini ${r.status}: ${(await r.text()).slice(0, 500)}`);
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
    });
    const word = out.toLowerCase().replace(/[^a-z]/g, "");
    const cats = ["fire", "smoke", "road", "flood", "animal", "heat", "other"];
    return json({ category: cats.includes(word) ? word : null });
  } catch (e) {
    return json({ error: String(e.message).slice(0, 120) }, 502);
  }
}

// --- Predictive Risk Scoring (internal, called by pipeline) ---
// Returns { wilayaCode: { score: 0-100, hazard, factors: string[] } }
export async function geminiRiskScore(env, context) {
  if (!env.GEMINI_API_KEY) return null;
  try {
    const out = await geminiGenerate(env, {
      system: `You are the predictive risk engine for Rad Balek (Algeria early-warning). ` +
        `Given current multi-source hazard data for Algeria, output a JSON object mapping ` +
        `wilaya codes (1-58) to risk assessments. Each entry: {score: 0-100, hazard: string, ` +
        `factors: string[]}. Only include wilayas with score >= 30. Be conservative: ` +
        `false alarms erode trust more than missed events. Consider: official ONM vigilance, ` +
        `FIRMS fire clusters, recent quakes, weather forecasts, citizen reports. ` +
        `Hazards: heat, fire, flood, storm, wind, sandstorm, cold, quake, road, other. ` +
        `Reply with VALID JSON ONLY, no markdown, no commentary.`,
      contents: [{ role: "user", parts: [{ text: String(context).slice(0, 6000) }] }],
      maxTokens: 1500,
      temperature: 0.2,
      noThinking: true,
    });
    const parsed = JSON.parse(out);
    if (typeof parsed !== "object" || parsed === null) return null;
    const result = {};
    for (const [code, v] of Object.entries(parsed)) {
      const c = Number(code);
      if (!Number.isInteger(c) || c < 1 || c > 58) continue;
      if (!v || typeof v.score !== "number") continue;
      result[c] = { score: Math.min(100, Math.max(0, v.score)), hazard: String(v.hazard || "other"), factors: Array.isArray(v.factors) ? v.factors.slice(0, 5) : [] };
    }
    return Object.keys(result).length ? result : null;
  } catch {
    return null; // fail-open: no risk scores rather than wrong ones
  }
}

// POST /v1/ai/risk  { context } -> per-wilaya risk scores (admin/dev only)
export async function handleRisk(request, url, env) {
  // F1: this endpoint can spend the Gemini key and returns model-derived risk
  // assessments. The Flutter app never calls it, so it is admin-only.
  if (!(await adminAuthed(request, url, env))) return json({ error: "forbidden" }, 403);
  if (!env.GEMINI_API_KEY) return json({ error: "ai disabled" }, 503);
  if (!(await rateOk(env, request, 10))) return json({ error: "rate limit" }, 429);
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }
  const context = String(b.context || "").slice(0, 6000);
  if (!context) return json({ error: "context required" }, 400);
  try {
    const scores = await geminiRiskScore(env, context);
    return json({ scores: scores || {}, generatedAt: new Date().toISOString() });
  } catch (e) {
    return json({ error: String(e.message).slice(0, 160) }, 502);
  }
}
