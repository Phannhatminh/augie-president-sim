# Office of the President — Augustana College Simulator

A satirical story game: you are the brand-new President of Augustana College for one fall semester (9 class weeks + Finals Week). Every week a crisis lands on your desk. Issue any executive order you like, or ignore it, and watch the campus lose its mind. Your decisions come back to haunt you in later weeks.

Built for Hacktoberfest Hack Day 2026 (theme: **Unhinged**). The UI is a deliberately sluggish late-90s government web site, with pop-ups, fake loading dialogs and other annoyances.

> Fictional satire. Not affiliated with or endorsed by Augustana College.

## Two ways to play

| | **Form Edition** (`/`) | **Interactive Edition** (`/stick.html`) |
|---|---|---|
| How you play | Type any executive order into a 1987-style government form | Stick-figure scenes with timed multiple-choice decisions |
| Reactions | Written live by **Gemma 4**: press clippings, Professor Highlights, a Student Highlight | Fully scripted |
| Needs an API key? | **Yes** (or a local Ollama model) | **No** |

## Quick start

### 1. Install Node.js

You need **Node.js 20.12 or newer**. Check with:

```sh
node -v
```

If it's missing or too old, get the LTS version from https://nodejs.org (or run `nvm use` if you use nvm; the repo has a `.nvmrc`).

### 2. Get the code

```sh
git clone https://github.com/Phannhatminh/augie-president-sim.git
cd augie-president-sim
npm install
```

### 3. Add a Gemini API key (for the Form Edition)

1. Get a free key at https://aistudio.google.com/apikey (any Google account works).
2. Copy the example config and paste your key in:

   ```sh
   cp .env.example .env
   ```

   Then open `.env` and fill in the line:

   ```
   GEMINI_API_KEY=your-key-here
   ```

On Windows (Command Prompt), use `copy .env.example .env` instead of `cp`.

`.env` is in `.gitignore`, so your key never gets committed. You can skip this step to play only the Interactive Edition.

### 4. Run it

```sh
npm start
```

Open http://localhost:3000 in your browser. Turn your sound on: there's music.

For development, `npm run dev` restarts the server automatically when you edit a file.

## Configuration

All settings are environment variables, read from `.env` or from the shell (`GEMINI_API_KEY=... npm start` works too).

| Variable | Default | What it does |
|---|---|---|
| `GEMINI_API_KEY` | (none) | Google AI Studio key. Required for the Form Edition unless you use Ollama. |
| `GEMMA_MODEL` | `gemma-4-26b-a4b-it` | First model to try on the Gemini API. |
| `PORT` | `3000` | Port the server listens on. |
| `OLLAMA_URL` | `http://localhost:11434` | Local Ollama server, used as a fallback. |
| `OLLAMA_MODEL` | `gemma4:e4b` | Model to use on Ollama. |

**Model fallback:** each turn tries `GEMMA_MODEL`, then `gemma-4-31b-it`, then Ollama, then `gemini-3.5-flash-lite`. If a model fails or takes longer than 20 seconds, it's skipped for 3 minutes. The game keeps going even when the Gemma API is overloaded.

**No API key at all?** Install [Ollama](https://ollama.com), run `ollama pull gemma4:e4b`, and keep Ollama running. The Form Edition will use that local model. It's slower and needs a reasonably strong machine.

## Tips

- **Jump to a week:** add `?week=7` to the URL (for example `http://localhost:3000/?week=7`) to start at week 7. Handy for rehearsing a demo.
- **A turn takes a while:** the Form Edition waits on the AI, usually around 10 to 20 seconds. The loading dialog is slow on purpose too.
- **Game over:** if overall approval drops to 10% or below, you're removed from office.

## Troubleshooting

| Problem | Fix |
|---|---|
| `GEMINI_API_KEY is not set` warning on startup | Create `.env` (step 3). The Interactive Edition still works without it. |
| `500 Internal Server Error ... Could not load the default credentials` in the game | Same: the Form Edition has no key and no Ollama to fall back on. |
| `Error: listen EADDRINUSE :::3000` | Something else is using port 3000. Run `PORT=3001 npm start` and open http://localhost:3001. |
| `process.loadEnvFile is not a function` or a syntax error on start | Your Node.js is too old. Install 20.12 or newer. |
| Turns are very slow or fail | The Gemma API may be overloaded. Wait a minute, or set up Ollama as a local fallback. |

## Changing the game

| File | What's in it |
|---|---|
| `server/game.js` | Weekly events, constituencies (subgroups), press outlets, premise, term length |
| `server/professors.js` | Professor Highlight names, comic voices, fallback quotes |
| `server/students.js` | Student Highlight names, voices, fallback quotes |
| `server/script.js` | The whole scripted Interactive Edition: scenes, choices, outcomes, epilogue |
| `server/index.js` | API routes and the Gemma prompt (tone rules live here) |
| `server/gemma.js` | Model calls, fallback order, timeouts, JSON parsing |
| `server/env.js` | Loads `.env` if present |
| `public/` | Front end: `index.html` + `app.js` (Form), `stick.html` + `stick.js` (Interactive), `common.js` (shared), annoyances, music |

## Credits

Music: "Fluffing a Duck" by Kevin MacLeod (incompetech.com), licensed under Creative Commons: By Attribution.
