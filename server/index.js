import "./env.js"; // must run before gemma.js reads the API key
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { askJSON } from "./gemma.js";
import { SCRIPT, epilogue } from "./script.js";
import { pickProfessors, templateQuote } from "./professors.js";
import { pickStudents, studentQuote } from "./students.js";
import { SUBGROUPS, PERSONAS, OUTLETS, TERM_WEEKS, MIDTERM_WEEK, PREMISE, newGame, eventForWeek } from "./game.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = express();
app.use(express.json());
app.use(express.static(path.join(root, "public")));

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
const overall = (groups) => clamp(Object.values(groups).reduce((a, b) => a + b, 0) / Object.keys(groups).length);

function record(state) {
  return state.history.map((h) => `Week ${h.week} (${h.event}): ${h.policy} -> ${h.summary}`).join("\n") || "None yet (this is week 1).";
}

app.get("/api/new", (_req, res) =>
  res.json({ state: newGame(), premise: PREMISE, subgroups: SUBGROUPS, personas: PERSONAS, outlets: OUTLETS, termWeeks: TERM_WEEKS }));

// The event is always the fixed one for the week; Gemma's continuity rides along as follow-up memos.
app.post("/api/briefing", (req, res) => {
  const { state } = req.body;
  const fallout = state.pendingFallout.filter((f) => f.week <= state.week);
  state.pendingFallout = state.pendingFallout.filter((f) => f.week > state.week);
  res.json({ event: eventForWeek(state), fallout: fallout.map((f) => f.memo), state });
});

app.post("/api/turn", async (req, res) => {
  const { state, event, fallout = [], policy, spin, ignored } = req.body;
  if (!ignored && !policy?.trim()) return res.status(400).json({ error: "Executive order text is required." });
  const action = ignored
    ? "The President took NO action and ignored this week's event entirely. Campus should react to the silence."
    : `The President's executive order: "${policy}"\nPress statement / spin: "${spin || "(none)"}"`;
  const isFinals = state.week === TERM_WEEKS;
  const nextSeed = isFinals ? null : eventForWeek(state, state.week + 1);
  const lastQuotes = Object.entries(state.lastQuotes).map(([id, q]) => `${id}: "${q}"`).join("; ") || "(none yet)";
  const profs = pickProfessors();
  const students = pickStudents();
  const policyText = ignored ? "doing nothing at all" : policy;
  try {
    const out = await askJSON(`You are the narrator of a satirical story game: the player is President of Augustana College (Rock Island, Illinois; Lutheran liberal arts; mascot: the Vikings; landmarks: Old Main, the Slough, Westerlin, Andreen, Gerber Dining Center, Tredway Library, the Quad, the Brew, Hanson Science).
Tone: FULLY UNHINGED campus satire. Go big: escalate every situation to absurd, chaotic extremes (geese uprisings, cults forming in Westerlin, the Slough achieving sentience), dramatic overreactions, wild consequences, chaotic energy. Keep it PG-13: no slurs, no sexual content, no graphic violence, mild language only (e.g. "hell", "damn"). Never target real named individuals.
This is ONE continuous story across a fall semester of ${TERM_WEEKS} weeks. Every week must build on what came before: recurring characters, running jokes, unresolved storylines, and the President's past decisions should keep coming back.

STORY SO FAR:
${state.story}

FULL RECORD OF THE PRESIDENT'S DECISIONS:
${record(state)}

WHAT CAMPUS SAID LAST WEEK (keep them consistent; they remember and hold grudges):
${lastQuotes}

NOW: week ${state.week} of ${TERM_WEEKS}${isFinals ? " (FINALS WEEK, the final chapter)" : ""}.
This week's situation: ${event.title}. ${event.body}
${fallout.length ? `Consequences of earlier decisions landing this week: ${fallout.join(" ")}` : ""}
${action}

Constituencies (for groupDeltas): ${SUBGROUPS.map((g) => `${g.id} (${g.name})`).join(", ")}
Outlets: ${OUTLETS.map((o) => `${o.id} = ${o.name} (${o.slant})`).join("; ")}

Reference earlier weeks when it fits.
${isFinals
  ? `This is the end. Write an "epilogue": 4-6 sentences wrapping up the whole semester's story, calling back to the President's biggest decisions, and the Board's final verdict.`
  : `Next week's event is fixed: "${nextSeed.title}: ${nextSeed.body}". Write a "fallout" memo: one sentence on how this week's decision will make next week worse (or weirder).`}

Also write a "Professor Highlight" for each of these parody faculty members, in their comic voice, reacting to the President's action and this week's event (one or two sentences, unhinged, no insults about real people): ${profs.map((p) => `${p.name} (${p.voice})`).join("; ")}.
And a "Student Highlight" from ${students.map((s) => `${s.name} (${s.voice})`).join("; ")}: one or two sentences of raw student reaction (slang, memes, gossip, complaints) to this week's disaster and the President's action. Make it genuinely funny.

Return ONLY JSON:
{
  "professors": [{"name": "<professor name>", "quote": "..."}],
  "students": [{"name": "<student name>", "quote": "..."}],
  "groupDeltas": {"<subgroup id>": -15..15},
  "headlines": [{"id": "<outlet id>", "headline": "...", "lede": "one sentence"}],
  "status": "APPROVED|CONTESTED|BACKLASH|RIOT",
  "summary": "one sentence of what happened this week",
  "story": "the updated story so far: 4-6 sentences covering the whole semester up to now, including open storylines",
  ${isFinals ? `"epilogue": "..."` : `"fallout": {"memo": "..."}`}
}`);
    // Gemma sometimes invents its own ids; fall back to list order.
    out.headlines = (out.headlines || []).map((h, i) => ({ ...h, id: OUTLETS.some((o) => o.id === h.id) ? h.id : OUTLETS[i]?.id }));
    // Keep the professors we picked, in order; a template covers any Gemma skipped.
    out.professors = profs.map((p, i) => {
      const written = (out.professors || []).find((x) => x.name === p.name) || out.professors?.[i];
      return { name: p.name, quote: written?.quote || templateQuote(p, policyText, event.title) };
    });
    out.students = students.map((s, i) => {
      const written = (out.students || []).find((x) => x.name === s.name) || out.students?.[i];
      return { name: s.name, quote: written?.quote || studentQuote(s, policyText, event.title) };
    });
    // Gemma keys these by id or by name ("Students", "Board"); accept either.
    const groupFor = (key) => {
      const k = String(key).toLowerCase();
      return SUBGROUPS.find((g) => g.id === k || g.name.toLowerCase() === k || g.name.toLowerCase().startsWith(k) || k.startsWith(g.id))?.id;
    };
    for (const [key, d] of Object.entries(out.groupDeltas || {})) {
      const g = groupFor(key);
      if (g && Number.isFinite(Number(d))) state.groups[g] = clamp(state.groups[g] + Number(d));
    }
    const prevApproval = state.approval;
    state.approval = overall(state.groups);
    out.approvalDelta = state.approval - prevApproval;
    state.history.push({ week: state.week, event: event.title, policy: ignored ? "(ignored)" : policy, summary: out.summary });
    state.lastQuotes = Object.fromEntries([...out.professors, ...out.students].map((x) => [x.name, x.quote]));
    if (out.story) state.story = out.story;
    if (out.fallout?.memo && !isFinals) state.pendingFallout.push({ week: state.week + 1, memo: out.fallout.memo });
    const orderNo = ignored ? null : `EO-2026-${String(state.orderNo++).padStart(3, "0")}`;
    const midterm = state.week === MIDTERM_WEEK;
    state.week++;
    res.json({ result: out, orderNo, state, midterm, gameOver: isFinals || state.approval <= 10 });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ---- Interactive (stick-figure) edition: fully scripted, no AI ----
const GROUP_ORDER = ["students", "faculty", "staff", "alumni", "parents", "board"];

app.post("/api/stick/briefing", (req, res) => {
  const { state } = req.body;
  const week = SCRIPT[state.week - 1];
  const flags = state.flags || [];
  // Call back to up to two earlier decisions, most recent first.
  const callbacks = [...flags].reverse().map((f) => week.callbacks?.[f]).filter(Boolean).slice(0, 2);
  res.json({
    event: { title: week.title, scene: week.scene, severity: week.severity, body: [week.body, ...callbacks].join(" "),
      choices: week.choices.map(({ label, outcome }) => ({ label, outcome })) },
    fallout: [],
    state,
  });
});

app.post("/api/stick/turn", (req, res) => {
  const { state, event, choiceIndex } = req.body;
  const week = SCRIPT[state.week - 1];
  const choice = Number.isInteger(choiceIndex) ? week.choices[choiceIndex] : null;
  const s = choice ? choice.result : week.timeout;
  state.flags = state.flags || [];
  if (s.flag) state.flags.push(s.flag);

  GROUP_ORDER.forEach((g, i) => (state.groups[g] = clamp(state.groups[g] + s.deltas[i])));
  const prevApproval = state.approval;
  state.approval = overall(state.groups);
  state.history.push({ week: state.week, event: event.title, policy: choice ? choice.label : "(froze)", summary: s.summary });
  state.story = [state.story, s.summary].join(" ");

  const isFinals = state.week === TERM_WEEKS;
  const result = {
    status: s.status,
    summary: s.summary,
    approvalDelta: state.approval - prevApproval,
    groupDeltas: Object.fromEntries(GROUP_ORDER.map((g, i) => [g, s.deltas[i]])),
    // Only the people with something to say this week show up in the report.
    reactions: PERSONAS.filter((p) => s.quotes[p.id]).map((p) => {
      const d = s.deltas[GROUP_ORDER.indexOf(p.group)];
      return { id: p.id, quote: s.quotes[p.id], score: Math.max(-10, Math.min(10, d)) };
    }),
    headlines: OUTLETS.map((o, i) => ({ id: o.id, headline: s.headlines[i][0], lede: s.headlines[i][1] })),
    professors: pickProfessors().map((p) => ({ name: p.name, quote: templateQuote(p, choice ? choice.label : "standing there doing nothing", week.title) })),
    students: pickStudents().map((st) => ({ name: st.name, quote: studentQuote(st, choice ? choice.label : "standing there doing nothing", week.title) })),
    epilogue: isFinals ? epilogue(state.approval, state.flags) : undefined,
  };
  const orderNo = choice ? `EO-2026-${String(state.orderNo++).padStart(3, "0")}` : null;
  const midterm = state.week === MIDTERM_WEEK;
  state.week++;
  res.json({ result, orderNo, state, midterm, gameOver: isFinals || state.approval <= 10 });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Office of the President open at http://localhost:${port}`));
