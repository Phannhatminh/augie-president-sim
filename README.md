# Office of the President — Augustana College Simulator

Satirical story game: you are President of Augustana College for the fall semester (9 class weeks + finals week). Each week an event hits; issue any executive order or ignore it. Gemma 4 role-plays campus subgroups (students, faculty, staff, alumni, parents, Board) and the press reacting, and decisions come back as fallout weeks later.

Built for Hacktoberfest Hack Day 2026 (theme: Unhinged). UI is a deliberately sluggish late-90s government web site.

## Run

Needs Node.js 20.12 or newer.

```sh
npm install
cp .env.example .env   # then put your GEMINI_API_KEY (Google AI Studio) in it
npm run dev            # http://localhost:3000 (npm start for no auto-reload)
```

Instead of a `.env`, the same variables can be set in the environment (`GEMINI_API_KEY=... npm start`). Optional: `GEMMA_MODEL` (default `gemma-4-26b-a4b-it`), `PORT`, and `OLLAMA_URL` / `OLLAMA_MODEL` for a local Gemma fallback via Ollama. The Interactive edition is fully scripted and runs without any key.

## Where things live

- `server/game.js` — weekly event list, subgroups and personas, outlets, term length (edit these to change the game)
- `server/students.js`, `server/professors.js` — parody Student / Professor Highlight names, voices, fallback quotes
- `server/index.js` — `/api/new`, `/api/briefing`, `/api/turn` and the Gemma prompts
- `server/gemma.js` — Gemma 4 call via the Gemini API, JSON parsing
- `public/` — retro government-site front end
