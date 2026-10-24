// Weekly annoyances from the owner's spec, shared by both editions.
// runAnnoyances(week, { target }) mounts the week's annoyances and resolves once the blocking ones are cleared;
// `target` is the element the week-8 fly sits on (the submit button / the choice row).
import { sleep } from "./common.js";

// Single quotes so the url() can sit inside a style="..." attribute (encodeURIComponent leaves ' alone; the SVGs have none).
const svgUrl = (svg) => `url('data:image/svg+xml,${encodeURIComponent(svg)}')`;

// The photo club's leaked shot: the President dancing on his balcony in tiger boxers.
const BOXERS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
<defs>
  <pattern id="t" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width="18" height="18" fill="#ff8c00"/><path d="M0 4 Q9 9 18 4 M0 13 Q9 17 18 12" stroke="#000" stroke-width="3" fill="none"/></pattern>
  <filter id="g"><feTurbulence baseFrequency=".9" numOctaves="2"/><feColorMatrix values="0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 .18 0"/><feComposite in2="SourceGraphic" operator="in"/><feBlend in="SourceGraphic" mode="multiply"/></filter>
  <radialGradient id="f" cx="62%" cy="38%"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".35" stop-color="#fff6c0" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
</defs>
<g filter="url(#g)">
  <rect width="400" height="300" fill="#141a2e"/>
  <rect x="40" y="20" width="320" height="200" fill="#3b3326"/><rect x="170" y="40" width="70" height="150" fill="#f5d77a"/>
  <rect x="40" y="200" width="320" height="16" fill="#555"/>
  <g stroke="#222" stroke-width="5"><path d="M40 216 V270 M80 216 V270 M120 216 V270 M160 216 V270 M200 216 V270 M240 216 V270 M280 216 V270 M320 216 V270 M360 216 V270 M30 270 H370"/></g>
  <g transform="translate(245 140) rotate(-12)">
    <circle cy="-62" r="20" fill="#f1c9a0" stroke="#000" stroke-width="4"/>
    <path d="M-8 -56 Q0 -48 8 -56" stroke="#000" stroke-width="3" fill="none"/><circle cx="-7" cy="-66" r="2.5"/><circle cx="7" cy="-66" r="2.5"/>
    <line y1="-42" y2="20" stroke="#000" stroke-width="7"/>
    <path d="M0 -30 L-40 -70 M0 -30 L45 -60" stroke="#000" stroke-width="7" stroke-linecap="round"/>
    <path d="M-22 14 H22 L26 44 H4 L0 30 L-4 44 H-26 Z" fill="url(#t)" stroke="#000" stroke-width="3"/>
    <path d="M-14 44 L-34 90 M14 44 L40 80" stroke="#000" stroke-width="7" stroke-linecap="round"/>
  </g>
  <rect width="400" height="300" fill="url(#f)"/>
</g>
<text x="12" y="290" font-family="Courier New" font-size="14" fill="#ffae00">10.03.26 11:47 PM</text>
<text x="388" y="22" font-family="Arial Black" font-size="13" fill="#fff" text-anchor="end" opacity=".7">AUGIE PHOTO CLUB</text>
</svg>`;

// Rolled-up newspaper cursor; hotspot at the striking end.
const NEWSPAPER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
<g transform="rotate(-40 28 28)"><rect x="6" y="20" width="44" height="16" rx="6" fill="#f2ecd8" stroke="#222" stroke-width="2"/>
<ellipse cx="6" cy="28" rx="4" ry="8" fill="#ddd4b8" stroke="#222" stroke-width="2"/><path d="M14 24 H44 M14 28 H40 M14 32 H44" stroke="#777" stroke-width="1.5"/>
<rect x="28" y="20" width="5" height="16" fill="#c00"/></g></svg>`;

const mounted = []; // elements to remove when the week ends

function mount(html, cls) {
  const el = document.createElement("div");
  el.className = cls;
  el.innerHTML = html;
  document.body.append(el);
  mounted.push(el);
  return el;
}

const fly = (cls, style = "") => `<div class="fly ${cls}" style="background-image:url('/img/fly.png');${style}"></div>`;

export function resetAnnoyances() {
  while (mounted.length) mounted.pop().remove();
  document.querySelector(".page")?.classList.remove("quake");
  document.body.classList.remove("newspaper-cursor");
}

// From week 6 on, the leaked photo is the background for the rest of the semester.
export function applyBackground(week) {
  document.body.style.setProperty("--leak", svgUrl(BOXERS_SVG));
  document.body.classList.toggle("leaked", week >= 6);
}

export async function runAnnoyances(week, { target } = {}) {
  document.body.style.setProperty("--newspaper", svgUrl(NEWSPAPER_SVG));
  if (week === 4) {
    mount(`<span>&#9733; HOT HARVARD PROFESSORS 2 MILES AWAY WANT TO TEACH AT YOUR SCHOOL! &#9733;</span><span class="ad-cta">CLICK HERE!!!</span>`, "annoy-banner");
    await phishingPopup();
  }
  if (week === 5) await singForTheBank();
  if (week === 7) mount(fly("fly-center"), "annoy-layer");
  if (week === 8) await swatTheFly(target);
  if (week === 10) await finalsChaos();
}

// Week 4: fake virus alert that asks for bank details. Nothing typed here is read or sent anywhere.
function phishingPopup() {
  return new Promise((done) => {
    const el = mount(`
      <div class="window annoy-window phish">
        <div class="titlebar">&#9888; SYSTEM ALERT - VIRUS DETECTED!!! <span class="x" data-close>&times;</span></div>
        <div class="phish-body">
          <p><b>WARNING!!!</b> Your computer is infected with <b class="blinky">47 VIRUSES</b>.</p>
          <p>Enter your bank login and password below to fix your system immediately.</p>
          <label>Bank username <input autocomplete="off" /></label>
          <label>Password <input type="password" autocomplete="off" /></label>
          <p class="small">(This is a fake popup in a game. Nothing you type goes anywhere.)</p>
          <button data-close>FIX MY SYSTEM NOW</button>
        </div>
      </div>`, "annoy-modal");
    el.querySelectorAll("[data-close]").forEach((b) => (b.onclick = () => {
      el.remove();
      done();
    }));
  });
}

// Week 5: sing an apology to Chase Bank customer support with the arrow keys.
function singForTheBank() {
  const KEYS = { ArrowLeft: "&#9664;", ArrowUp: "&#9650;", ArrowRight: "&#9654;", ArrowDown: "&#9660;" };
  const LYRICS = ["Dear Chase Bank &#9834;", "I'm so sorry &#9835;", "We got hacked &#9834;", "Please unfreeze &#9835;", "Our money &#9834;&#9834;&#9834;"];
  const BEAT_MS = 900;
  const seq = ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", Object.keys(KEYS)[Math.floor(Math.random() * 4)]];
  return new Promise((done) => {
    const el = mount(`
      <div class="window annoy-window rhythm">
        <div class="titlebar">Chase Bank Customer Support - Account FROZEN</div>
        <div class="rhythm-body">
          <p><b>Your school's funds are frozen.</b> Sing an apology to unfreeze them. Press each arrow key <b>on the beat</b> as it lights up.</p>
          <div class="notes">${seq.map((k, i) => `<div class="note" data-i="${i}">${KEYS[k]}</div>`).join("")}</div>
          <div class="lyric" id="lyric">Get ready...</div>
        </div>
      </div>`, "annoy-modal");
    const notes = [...el.querySelectorAll(".note")];
    let step = -1, hit = false, timer;

    const fail = () => {
      clearInterval(timer);
      el.querySelector("#lyric").innerHTML = "OFF KEY! Chase hung up. Try again...";
      el.querySelector(".rhythm").classList.add("wrong");
      setTimeout(start, 1400);
    };
    const beat = () => {
      if (step >= 0 && !hit) return fail();
      step++;
      hit = false;
      notes.forEach((n, i) => n.classList.toggle("now", i === step));
      if (step === seq.length) {
        clearInterval(timer);
        document.removeEventListener("keydown", onKey, true);
        el.querySelector("#lyric").innerHTML = "&#9835; ACCOUNT UNFROZEN &#9835; Chase forgives you.";
        setTimeout(() => {
          el.remove();
          done();
        }, 1200);
      }
    };
    const onKey = (e) => {
      if (!(e.key in KEYS)) return;
      e.preventDefault();
      if (step < 0 || step >= seq.length || hit) return;
      if (e.key !== seq[step]) return fail();
      hit = true;
      notes[step].classList.add("good");
      el.querySelector("#lyric").innerHTML = LYRICS[step];
    };
    const start = () => {
      el.querySelector(".rhythm").classList.remove("wrong");
      notes.forEach((n) => n.classList.remove("good", "now"));
      step = -1;
      el.querySelector("#lyric").innerHTML = "&#9834; 3... 2... 1... &#9834;";
      clearInterval(timer);
      setTimeout(() => {
        beat();
        timer = setInterval(beat, BEAT_MS);
      }, 1500);
    };
    document.addEventListener("keydown", onKey, true);
    start();
  });
}

// Week 8: a fly sits on the submit button. Hit it three times with the newspaper.
function swatTheFly(target) {
  document.body.classList.add("newspaper-cursor");
  for (let i = 0; i < 4; i++) {
    mount(fly("fly-deco", `left:${8 + Math.random() * 80}vw;top:${12 + Math.random() * 70}vh;transform:rotate(${Math.random() * 360}deg)`), "annoy-layer");
  }
  return new Promise((done) => {
    const r = target.getBoundingClientRect();
    const size = Math.max(110, Math.min(160, r.height * 2.5));
    const el = mount(fly("fly-main"), "annoy-flyhost");
    Object.assign(el.style, { left: `${r.left + scrollX + r.width / 2 - size / 2}px`, top: `${r.top + scrollY + r.height / 2 - size / 2}px`, width: `${size}px`, height: `${size}px` });
    let hits = 0;
    el.onclick = async () => {
      hits++;
      el.classList.remove("hit");
      void el.offsetWidth;
      el.classList.add("hit");
      if (hits < 3) return;
      el.onclick = null;
      el.classList.add("squashed");
      await sleep(900);
      el.remove();
      done();
    };
  });
}

// Finals: the meat twist, then the Board calls while the screen shakes.
function finalsChaos() {
  return new Promise((done) => {
    const news = mount(`
      <div class="window annoy-window news">
        <div class="titlebar">&#128240; BREAKING NEWS ALERT</div>
        <div class="news-body">
          <div class="news-flag">BREAKING</div>
          <h2>GERBER "HUMAN MEAT" WAS ACTUALLY 95% CHEAP SOY FILLER</h2>
          <p>Lab results are in. The rumor that shook campus in Week 3 was false. The meat was not human. It was barely meat.</p>
          <button data-ok>OK</button>
        </div>
      </div>`, "annoy-modal");
    news.querySelector("[data-ok]").onclick = () => {
      news.remove();
      document.querySelector(".page")?.classList.add("quake");
      let left = 3;
      for (let i = 0; i < 3; i++) {
        const call = mount(`
          <div class="window annoy-window call" style="top:${18 + i * 17}vh;left:${12 + i * 24}vw">
            <div class="titlebar">&#128222; INCOMING CALL (${i + 1} of 3)</div>
            <div class="call-body"><div class="ring">&#128222;</div><b>Board of Trustees</b><br />${["\"WHAT is happening on the Quad?!\"", "\"Pick up. PICK UP.\"", "\"We need to talk about your contract.\""][i]}<br />
            <button data-decline>Decline</button></div>
          </div>`, "annoy-call");
        call.querySelector("[data-decline]").onclick = () => {
          call.remove();
          if (--left === 0) {
            document.querySelector(".page")?.classList.remove("quake");
            done();
          }
        };
      }
    };
  });
}
