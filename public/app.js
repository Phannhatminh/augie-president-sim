import { $, esc, api, glitchPage, weekLabel, initChrome, renderSidebar, renderReport, jumpWeek } from "./common.js";
import { runAnnoyances, resetAnnoyances, applyBackground } from "./annoyances.js";
import { onboarding, unskippableAd, mountSkipWeek } from "./ragebait.js";
import { startMusic, mountMusicToggle } from "./music.js";

let game, state, event, fallout;
let weekGen = 0; // bumps when a week is skipped, so a stale annoyance wait doesn't re-enable buttons

initChrome();
mountMusicToggle();

function show(section) {
  for (const id of ["start", "briefing", "results"]) {
    const el = $(id);
    el.hidden = id !== section;
    el.classList.remove("loading-in");
  }
  void $(section).offsetWidth; // restart the dial-up reveal animation
  $(section).classList.add("loading-in");
  glitchPage(section);
  window.scrollTo(0, 0);
}

async function loadBriefing() {
  const data = await api("/api/briefing", { state }, { cgi: "memo.pl" });
  ({ state, event, fallout } = data);
  $("memo").innerHTML = `<span class="stamp">${esc((event.severity || "urgent").toUpperCase())}</span>

MEMORANDUM

TO:      The President
FROM:    Office of Campus Affairs
DATE:    ${weekLabel(game, state.week)}, Fall Semester
RE:  <span class="new">NEW!</span>
<span class="re">${esc(event.title)}</span>------------------------------------------------------------
<span class="body">${esc(event.body)}</span>`;
  $("fallout").innerHTML = fallout.map((memo) => `<div class="fallout"><b>FOLLOW-UP NOTICE RE: A PRIOR DECISION.</b> <span class="hl">${esc(memo)}</span></div>`).join("");
  $("policy").value = "";
  $("spin").value = "";
  renderSidebar(game, state);
  resetAnnoyances();
  applyBackground(state.week);
  show("briefing");
  skipWeek.show(state.week < game.termWeeks);
  // The order can't be submitted until this week's blocking annoyances are dealt with.
  const gen = ++weekGen;
  $("sign").disabled = $("ignore").disabled = true;
  await runAnnoyances(state.week, { target: $("sign") });
  if (gen !== weekGen) return;
  $("sign").disabled = $("ignore").disabled = false;
}

const skipWeek = mountSkipWeek(async () => {
  if (!$("loading").hidden) return; // a turn is mid-request
  if (!$("results").hidden) return $("next").click(); // already done with this week
  state.history.push({ week: state.week, event: event.title, policy: "(skipped, NOOB)", summary: "" });
  state.week++;
  await loadBriefing();
});

$("begin").onclick = async () => {
  startMusic(); // needs to happen inside the click, before any await
  await onboarding();
  game = await api("/api/new", null, { cgi: "oath.pl" });
  state = game.state;
  state.week = jumpWeek(game);
  await loadBriefing();
};

async function submitTurn(ignored) {
  if (!ignored && !$("policy").value.trim()) {
    $("error").innerHTML = "<b>ERROR:</b> Field 1 (Text of Order) is required. Please complete all required fields marked with *.";
    $("error").hidden = false;
    return;
  }
  $("sign").disabled = $("ignore").disabled = true;
  const prevGroups = { ...state.groups };
  try {
    const data = await api("/api/turn", { state, event, fallout, ignored, policy: $("policy").value, spin: $("spin").value }, { cgi: "submit_eo.pl" });
    state = data.state;
    renderReport(game, state, data, prevGroups, ignored);
    $("next").textContent = data.gameOver ? "Begin a New Term >>" : state.week === game.termWeeks ? "Start the Final Exams >>" : "Proceed to Next Week >>";
    $("next").onclick = data.gameOver ? () => $("begin").onclick() : async () => {
      if (state.week === game.termWeeks) await unskippableAd(); // only before finals
      await loadBriefing();
    };
    renderSidebar(game, state);
    show("results");
  } finally {
    $("sign").disabled = $("ignore").disabled = false;
  }
}

$("order-form").onsubmit = (e) => {
  e.preventDefault();
  submitTurn(false);
};
$("ignore").onclick = () => submitTurn(true);

// Start page: show the premise.
fetch("/api/new").then((r) => r.json()).then((g) => {
  $("premise").textContent = g.premise;
  glitchPage("start");
});
