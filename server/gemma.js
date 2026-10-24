import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const COOLDOWN_MS = 3 * 60 * 1000;
const TIMEOUT_MS = 20_000; // an overloaded model gets skipped rather than holding up the turn

// Tried in order. Gemma on the Gemini API first, then local Gemma via Ollama, then Gemini Flash as a last resort
// so the demo never stalls when the API is overloaded.
const PROVIDERS = [
  { name: process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it", call: (p, name) => gemini(name, p, { thinkingConfig: { thinkingLevel: "minimal" } }) },
  { name: "gemma-4-31b-it", call: (p, name) => gemini(name, p, { thinkingConfig: { thinkingLevel: "minimal" } }) },
  { name: process.env.OLLAMA_MODEL || "gemma4:e4b", call: ollama },
  { name: "gemini-3.5-flash-lite", call: (p, name) => gemini(name, p) },
];

// A provider that just failed is skipped for a few minutes instead of failing every turn.
const downUntil = new Map();

async function gemini(model, prompt, config) {
  const res = await ai.models.generateContent({ model, contents: prompt, config: { ...config, abortSignal: AbortSignal.timeout(TIMEOUT_MS) } });
  return res.text ?? "";
}

async function ollama(prompt, model) {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    body: JSON.stringify({ model, prompt, format: "json", stream: false, think: false }),
    signal: AbortSignal.timeout(TIMEOUT_MS * 2), // local model is slower but always there
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  return (await res.json()).response;
}

// Ask for JSON and parse it, tolerating ```json fences and stray prose.
export async function askJSON(prompt) {
  let lastErr;
  const usable = PROVIDERS.filter((p) => !(downUntil.get(p.name) > Date.now()));
  for (const p of usable.length ? usable : PROVIDERS) {
    try {
      const text = await p.call(prompt, p.name);
      const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
      console.log(`answered by ${p.name}`);
      return json;
    } catch (err) {
      lastErr = err;
      downUntil.set(p.name, Date.now() + COOLDOWN_MS);
      console.warn(`${p.name} failed: ${String(err.message).slice(0, 160)}`);
    }
  }
  throw lastErr;
}
