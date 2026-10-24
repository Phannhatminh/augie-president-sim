// Shared by the form version (app.js) and the stick-figure version (stick.js).
export const $ = (id) => document.getElementById(id);
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const signed = (n) => `${n > 0 ? "+" : ""}${n ?? 0}`;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Highlighter color for a 0-100 rating.
export const rateClass = (v) => (v < 35 ? "hl-red" : v < 50 ? "hl" : "hl-green");
// Highlighter color for a +/- change.
export const deltaClass = (d) => (d < 0 ? "hl-red" : d > 0 ? "hl-green" : "hl");

const LOADING_MSGS = [
  "Contacting mainframe...", "Routing through Office of the Registrar...", "Faxing Faculty Senate...",
  "Awaiting Board of Trustees approval...", "Locating the correct form...", "Printing in triplicate...",
  "Stamping APPROVED (pending review)...", "Consulting the Lutheran heritage committee...", "Rebooting Wi-Fi...",
  "Waiting for Dave from facilities...", "Defragmenting the hard drive...",
];

// Every request goes through the Win98 dialog, and nothing finishes faster than `minMs`. Sluggishness is the point.
export async function api(path, body, { minMs = 2500, cgi = "process.pl" } = {}) {
  return withDialog(post(path, body), { minMs, cgi });
}

// The raw request, no dialog. Lets the stick version start Gemma while an animation plays.
export async function post(path, body) {
  const res = await fetch(path, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function withDialog(promise, { minMs = 2500, cgi = "process.pl" } = {}) {
  $("error").hidden = true;
  $("loading").hidden = false;
  document.body.style.cursor = "wait";
  $("statusbar").textContent = `Opening page http://www.president.augustana.edu/cgi-bin/${cgi}...`;
  let pct = 0, msg = 0;
  const tick = setInterval(() => {
    pct += (95 - pct) * 0.04; // crawls toward 95% and never quite gets there
    $("progress").style.width = `${pct}%`;
    if (Math.random() < 0.18) $("loading-msg").textContent = LOADING_MSGS[msg++ % LOADING_MSGS.length];
  }, 300);
  try {
    const [data] = await Promise.all([promise, sleep(minMs)]);
    $("progress").style.width = "100%";
    await sleep(500);
    return data;
  } catch (e) {
    $("error").innerHTML = `<b>500 Internal Server Error</b><br />The bureaucracy has failed: ${esc(e.message)}<br />Please try again or contact your system administrator.`;
    $("error").hidden = false;
    throw e;
  } finally {
    clearInterval(tick);
    $("loading").hidden = true;
    $("progress").style.width = "0";
    $("loading-msg").textContent = LOADING_MSGS[0];
    document.body.style.cursor = "";
    $("statusbar").textContent = "Done";
  }
}

// Render one random letter of `el` in the wrong font. Used sparingly.
export function breakFont(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const spots = [];
  for (let n; (n = walker.nextNode()); ) {
    if (n.parentElement.closest(".glitch")) continue;
    for (let i = 0; i < n.data.length; i++) if (/[A-Za-z]/.test(n.data[i])) spots.push([n, i]);
  }
  if (!spots.length) return;
  const [node, i] = spots[Math.floor(Math.random() * spots.length)];
  const letter = node.splitText(i);
  letter.splitText(1);
  const span = document.createElement("span");
  span.className = `glitch g${Math.floor(Math.random() * 5)}`;
  letter.replaceWith(span);
  span.append(letter);
}

// At most two broken letters per page, picked from the headline-ish text.
export function glitchPage(section) {
  const targets = [...$(section).querySelectorAll("h1, h2, .head, .memo, .verdict, p")];
  for (let k = 0; k < 2 && targets.length; k++) {
    if (Math.random() < 0.7) breakFont(targets.splice(Math.floor(Math.random() * targets.length), 1)[0]);
  }
}

export function weekLabel(game, week) {
  return week >= game.termWeeks ? "FINALS WEEK" : `WEEK ${week} OF ${game.termWeeks - 1}`;
}

// Rehearsal shortcut: ?week=7 starts the game at week 7.
export function jumpWeek(game) {
  const w = Number(new URLSearchParams(location.search).get("week"));
  return w >= 1 && w <= game.termWeeks ? w : 1;
}

export function initChrome() {
  $("counter").textContent = String(Math.floor(Math.random() * 90000) + 1000).padStart(6, "0");
  breakFont(document.querySelector(".masthead-title"));
}

export function renderSidebar(game, state) {
  $("hud").innerHTML = `<span class="hl">${weekLabel(game, Math.min(state.week, game.termWeeks))}</span><br /><br />APPROVAL: <span class="${rateClass(state.approval)}">${state.approval}%</span>`;
  $("ratings").innerHTML = game.subgroups.map((g) => {
    const v = state.groups[g.id];
    return `<div class="rating"><span class="label">${esc(g.name)}</span><span class="num ${rateClass(v)}">${v}%</span></div><span class="bar" style="width:${v}%"></span>`;
  }).join("") + `<div class="rating overall"><span class="label">OVERALL</span><span class="num ${rateClass(state.approval)}">${state.approval}%</span></div>`;
}

// Fills the results section: heading, summary, press clippings, highlight cards, constituent table.
export function renderReport(game, state, { result, orderNo, midterm, gameOver }, prevGroups, ignored) {
  $("result-heading").innerHTML = `<span class="order-no">${ignored ? "NO ACTION TAKEN" : `EXECUTIVE ORDER ${orderNo}`}</span><br />Campus Response: <span class="status ${esc(result.status)}">${esc(result.status)}</span>`;
  $("result-summary").innerHTML = `<p><span class="hl">${esc(result.summary)}</span></p>
    <p class="hl-big"><b>Overall approval:</b> <span class="${rateClass(state.approval)}">${state.approval}%</span> <span class="${deltaClass(result.approvalDelta)}">${signed(result.approvalDelta)}</span></p>
    ${midterm ? `<div class="verdict"><b>BOARD OF TRUSTEES MIDTERM REVIEW:</b> ${state.groups.board >= 50 ? "The Board grudgingly renews its confidence." : "The Board issues a formal letter of concern."}</div>` : ""}
    ${gameOver ? `<div class="verdict"><b>OFFICIAL END-OF-SEMESTER REPORT</b><br />${esc(result.epilogue || "")}<br /><br />${state.approval > 10 ? `Final approval: ${state.approval}%. ${state.groups.board >= 50 ? "The Board renews your contract." : "The Board declines to renew your contract."}` : "Vote of no confidence. You have been removed from office."}</div>` : ""}`;

  $("headlines").innerHTML = (result.headlines || []).map((h) => {
    const outlet = game.outlets.find((o) => o.id === h.id);
    return `<td class="clipping"><div class="outlet">${esc(outlet?.name || h.id)}</div><div class="head">${esc(h.headline)}</div><div class="small">${esc(h.lede)}</div></td>`;
  }).join("");

  $("professors").innerHTML = (result.professors || []).map((p) => `
    <article class="prof-card">
      <div class="prof-badge">&#127891; Professor Highlight</div>
      <div class="prof-name">Prof. ${esc(p.name)}</div>
      <blockquote>&ldquo;${esc(p.quote)}&rdquo;</blockquote>
    </article>`).join("");

  $("students").innerHTML = (result.students || []).map((s) => `
    <article class="student-card">
      <div class="student-top">
        <span class="student-avatar">${esc(s.name[0])}</span>
        <span><span class="student-name">${esc(s.name)}</span><br /><span class="student-handle">@${esc(s.name.toLowerCase().replace(/\s+/g, "_"))} &middot; just now</span></span>
        <span class="student-badge">Student Highlight</span>
      </div>
      <p class="student-quote">${esc(s.quote)}</p>
      <div class="student-stats">&#9825; ${Math.floor(Math.random() * 900) + 100} &nbsp; &#8634; ${Math.floor(Math.random() * 200) + 10} &nbsp; &#128172; ${Math.floor(Math.random() * 80) + 5}</div>
    </article>`).join("");

  // The Form edition has no constituent report; only the Interactive edition renders it.
  if (!$("reactions")) return;
  const byId = Object.fromEntries((result.reactions || []).map((r) => [r.id, r]));
  $("reactions").innerHTML = game.subgroups.map((g) => {
    const d = state.groups[g.id] - prevGroups[g.id];
    const speakers = g.personas.filter((p) => byId[p.id]);
    const groupCell = `<td class="group" rowspan="${Math.max(1, speakers.length)}">${esc(g.name)}<br /><span class="${rateClass(state.groups[g.id])}">${state.groups[g.id]}%</span> <span class="${deltaClass(d)}">${signed(d)}</span></td>`;
    if (!speakers.length) return `<tr>${groupCell}<td colspan="2"><i>No comment at this time.</i></td><td align="center"><span class="hl-big ${deltaClass(d)}">${signed(d)}</span></td></tr>`;
    return speakers.map((p, i) => {
      const r = byId[p.id];
      return `<tr>${i === 0 ? groupCell : ""}
        <td>${esc(p.name)}</td><td><i>&ldquo;${esc(r.quote)}&rdquo;</i></td><td align="center"><span class="hl-big ${deltaClass(r.score)}">${signed(r.score)}</span></td></tr>`;
    }).join("");
  }).join("");
}
