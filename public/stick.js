import { $, esc, sleep, api, post, withDialog, weekLabel, initChrome, renderSidebar, renderReport, jumpWeek } from "./common.js";
import { runAnnoyances, resetAnnoyances, applyBackground } from "./annoyances.js";
import { onboarding, unskippableAd, mountSkipWeek } from "./ragebait.js";
import { startMusic, mountMusicToggle } from "./music.js";

const DECISION_SECONDS = 10;
const GOOD = ["cheer", "dance", "money"]; // outcomes that get the "IT WORKED?!" stamp

let game, state, event, fallout;
let weekGen = 0; // bumps when a week is skipped; stale playWeek runs bail out
let cancelChoice = () => {};
let resolving = false;

initChrome();
mountMusicToggle();

const stage = $("stage");

function setStage(scene, outcome = "") {
  stage.dataset.scene = scene || "campus";
  stage.dataset.outcome = "";
  for (const k of ["react", "burn", "rescue", "heli"]) delete stage.dataset[k];
  stage.classList.remove("bw");
  void stage.offsetWidth; // restart CSS animations
  stage.dataset.outcome = outcome;
}

// Typewriter caption at the bottom of the stage.
async function type(html, text, cps = 45, stop = () => false) {
  $("caption").innerHTML = `${html}<br /><span id="typed"></span>`;
  const out = $("typed");
  for (let i = 0; i < text.length && !stop(); i++) {
    out.textContent += text[i];
    if (i % 2 === 0) await sleep(1000 / cps);
  }
}

// Fake RealPlayer buffering counter, for the vibe.
setInterval(() => {
  const b = $("buffer");
  b.textContent = String((Number(b.textContent) + Math.floor(Math.random() * 7)) % 100);
}, 400);

async function playWeek() {
  const gen = ++weekGen;
  const stale = () => gen !== weekGen;
  $("results").hidden = true;
  $("stamp").hidden = true;
  window.scrollTo(0, 0);
  const data = await api("/api/stick/briefing", { state }, { minMs: 1500, cgi: "load_scene.pl" });
  ({ state, event, fallout } = data);
  skipWeek.show(state.week < game.termWeeks);
  renderSidebar(game, state);
  resetAnnoyances();
  applyBackground(state.week);
  setStage(event.scene);
  const extra = fallout.length ? ` ALSO: ${fallout.join(" ")}` : "";
  await type(`<span class="title">${esc(weekLabel(game, state.week))}: ${esc(event.title)}</span>`, event.body + extra, 45, stale);
  await sleep(600);
  if (stale()) return;
  // Choices stay locked (and the clock stopped) until this week's blocking annoyances are cleared.
  const choice = await askChoice(event.choices || [], () => runAnnoyances(state.week, { target: $("choice-row") }));
  if (stale()) return;
  resolving = true;
  try {
    await resolve(choice);
  } finally {
    resolving = false;
  }
}

// Show the options with a countdown. Resolves with the picked choice, or null on timeout.
function askChoice(choices, gate) {
  return new Promise(async (done) => {
    const keys = ["A", "B", "C"];
    let finished = false;
    let raf;
    const onKey = (e) => {
      const i = keys.indexOf(e.key.toUpperCase());
      if (i >= 0 && choices[i]) finish(choices[i]);
    };
    const teardown = () => {
      finished = true;
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      $("choices").hidden = true;
      $("choices").querySelector(".timer").classList.remove("urgent");
    };
    const finish = (c) => {
      if (finished) return;
      teardown();
      done(c);
    };
    cancelChoice = teardown; // Skip Week: drop the choice without resolving

    $("choice-row").innerHTML = choices.map((c, i) => `<button class="choice" data-i="${i}" disabled><span class="key">[${keys[i]}]</span>${esc(c.label)}</button>`).join("");
    $("choices").hidden = false;
    $("timer-fill").style.width = "100%";
    $("timer-num").textContent = "LOCKED";
    await gate();
    if (finished) return;

    $("choice-row").querySelectorAll(".choice").forEach((b) => (b.disabled = false));
    document.addEventListener("keydown", onKey);
    $("choice-row").onclick = (e) => {
      const b = e.target.closest(".choice");
      if (b) finish(choices[Number(b.dataset.i)]);
    };
    const started = performance.now();
    const tick = () => {
      const left = DECISION_SECONDS - (performance.now() - started) / 1000;
      if (left <= 0) return finish(null);
      $("timer-fill").style.width = `${(left / DECISION_SECONDS) * 100}%`;
      $("timer-num").textContent = `DECIDE: ${left.toFixed(1)}s`;
      $("choices").querySelector(".timer").classList.toggle("urgent", left < 3);
      raf = requestAnimationFrame(tick);
    };
    tick();
  });
}

async function resolve(choice) {
  const ignored = !choice;
  const prevGroups = { ...state.groups };
  const submit = () => {
    const p = post("/api/stick/turn", { state, event, choiceIndex: choice ? event.choices.indexOf(choice) : null });
    p.catch(() => {}); // surfaced by withDialog below
    return p;
  };
  let pending = submit();

  const outcome = choice ? choice.outcome : "nothing";
  setStage(event.scene, outcome);
  await type(`<span class="title">${ignored ? "YOU FROZE." : "YOU CHOSE:"}</span>`, ignored ? "The clock ran out. The campus watched you do nothing." : choice.label);
  await sleep(1800);
  const stamp = $("stamp");
  stamp.className = `stamp-big ${ignored ? "froze" : GOOD.includes(outcome) ? "win" : "fail"}`;
  stamp.textContent = ignored ? "INDECISIVE" : GOOD.includes(outcome) ? "IT WORKED?!" : "FAIL";
  stamp.hidden = false;
  await sleep(1800);

  let data;
  while (!data) {
    try {
      data = await withDialog(pending, { minMs: 0, cgi: "campus_reaction.pl" });
    } catch {
      await retryClicked();
      pending = submit();
    }
  }
  state = data.state;
  renderSidebar(game, state);
  const verdict = await playReaction(data, prevGroups);
  await snapshot(data, verdict);
  renderReport(game, state, data, prevGroups, ignored);
  $("next").textContent = data.gameOver ? "▶ Begin a New Term" : state.week === game.termWeeks ? "▶ Start the Final Exams" : "▶ Play Next Week";
  $("next").onclick = data.gameOver ? start : async () => {
    if (state.week === game.termWeeks) await unskippableAd(); // only before finals
    await playWeek();
  };
  $("results").hidden = false;
  $("results").classList.remove("loading-in");
  void $("results").offsetWidth;
  $("results").classList.add("loading-in");
  $("results").scrollIntoView({ behavior: "smooth" });
}

// Adds a Try Again button to the error box and waits for it.
function retryClicked() {
  return new Promise((done) => {
    const b = document.createElement("button");
    b.textContent = "Try Again >>";
    b.style.marginTop = "8px";
    b.onclick = () => {
      $("error").hidden = true;
      done();
    };
    $("error").append(document.createElement("br"), b);
  });
}

const caption = (title, text) => ($("caption").innerHTML = `<span class="title">${esc(title)}</span><br />${esc(text)}`);

// Act out how campus took it: students riot or celebrate, maybe burn Old Main, money helicopters, final verdict.
async function playReaction({ result }, prevGroups) {
  const d = (g) => state.groups[g] - prevGroups[g];
  const president = stage.dataset.outcome;
  $("stamp").hidden = true;
  stage.dataset.outcome = ""; // the President is back on his feet for the aftermath
  void stage.offsetWidth;

  const rioting = d("students") < 0 || result.status === "RIOT";
  stage.dataset.react = rioting ? "riot" : "cheer";
  caption("STUDENT REACTION", rioting ? "The students are NOT happy. They are coming for you." : "The students are celebrating in the streets!");
  await sleep(2600);

  // Students can torch Old Main either way: in protest, or a victory bonfire that gets out of hand.
  if (result.status === "RIOT" || Math.abs(d("students")) >= 6 || Math.random() < 0.2) {
    stage.dataset.burn = "on";
    caption("BREAKING", rioting ? "Protesters have set OLD MAIN on fire!" : "The victory bonfire got out of hand. OLD MAIN IS ON FIRE!");
    await sleep(2400);
    stage.dataset.rescue = "on";
    caption("ROCK ISLAND FIRE & POLICE RESPOND", "Firefighters and police arrive to save what's left of Old Main.");
    await sleep(3000);
    stage.dataset.burn = "out";
    await sleep(1400);
    delete stage.dataset.rescue;
  }

  for (const [group, label, text] of [
    ["alumni", "ALUMNI FUND", "The alumni approve! A donor helicopter drops a bag of money."],
    ["board", "BOARD OF TRUSTEES", "The Board approves! A helicopter delivers a pile of dollars."],
  ]) {
    if (d(group) <= 0) continue;
    $("heli-label").textContent = label;
    delete stage.dataset.heli;
    void stage.offsetWidth;
    stage.dataset.heli = group;
    caption(`+${d(group)}% ${label}`, text);
    await sleep(3200);
  }
  delete stage.dataset.heli;

  const verdict = result.approvalDelta >= 2 || result.status === "APPROVED" ? ["SUCCESSFUL", "success"]
    : result.approvalDelta <= -2 || result.status === "RIOT" || result.status === "BACKLASH" ? ["DISAPPOINTMENT", "disappoint"]
    : ["???", "unknown"];
  $("stamp").className = `stamp-big ${verdict[1]}`;
  $("stamp").textContent = verdict[0];
  $("stamp").hidden = false;
  caption(`VERDICT: ${verdict[0]}`, result.summary);
  await sleep(2200);
  return verdict[0];
}

// Camera flash, freeze PRES_CAM in black and white, and drop the photo onto the front page.
async function snapshot({ result }, verdict) {
  $("flash").hidden = false;
  $("flash").style.animation = "none";
  void $("flash").offsetWidth;
  $("flash").style.animation = "";
  const photo = stage.cloneNode(true);
  photo.removeAttribute("id");
  photo.querySelectorAll(".caption, .choices, .stage-start, .flash").forEach((el) => el.remove());
  photo.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  stage.classList.add("bw");
  await sleep(1300);
  $("flash").hidden = true;

  const observer = result.headlines?.find((h) => h.id === "observer") || result.headlines?.[0];
  $("fp-dateline").textContent = `Rock Island, Ill. · ${weekLabel(game, state.week - 1)} · Price: 25¢ · Verdict: ${verdict}`;
  $("fp-headline").textContent = observer?.headline || result.summary;
  $("fp-photo").replaceChildren(photo);
  $("fp-photo").style.animation = "none";
  void $("fp-photo").offsetWidth;
  $("fp-photo").style.animation = "";
  $("fp-caption").textContent = `PHOTO: PRES_CAM. ${observer?.lede || result.summary}`;
}

const skipWeek = mountSkipWeek(async () => {
  if (resolving) return; // mid-outcome animation; let it finish
  if (!$("results").hidden) return $("next").click(); // already done with this week
  weekGen++;
  cancelChoice();
  resetAnnoyances();
  state.history.push({ week: state.week, event: event.title, policy: "(skipped, NOOB)", summary: "" });
  state.week++;
  await playWeek();
});

async function start() {
  startMusic(); // needs to happen inside the click, before any await
  await onboarding();
  game = await api("/api/new", null, { cgi: "oath.pl" });
  state = game.state;
  state.week = jumpWeek(game);
  $("start").hidden = true;
  await playWeek();
}

$("begin").onclick = start;

fetch("/api/new").then((r) => r.json()).then((g) => ($("premise").textContent = g.premise));
