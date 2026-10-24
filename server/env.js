// Loads .env when there is one. A missing file is fine: the keys can come from the real environment
// (a host's dashboard, CI, `GEMINI_API_KEY=... npm start`).
try {
  process.loadEnvFile();
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
if (!process.env.GEMINI_API_KEY) console.warn("GEMINI_API_KEY is not set: the Form edition will fail over to Ollama only. See .env.example.");
