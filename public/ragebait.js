// Ragebait, shared by both editions: a sign-up form that always rejects the first try, several rounds of
// Terms & Conditions, a "5 - 3" check whose only accepted answer is "1+1", and unskippable ads on Next Week.
// Nothing typed into these forms is read, stored, or sent anywhere.
import { sleep } from "./common.js";

function modal(html) {
  const el = document.createElement("div");
  el.className = "annoy-modal rage";
  el.innerHTML = html;
  document.body.append(el);
  return el;
}

const until = (el, sel, event = "click") => new Promise((done) => el.querySelector(sel).addEventListener(event, done, { once: true }));

// Demo shortcut on every form. Resolves when clicked.
const SKIP = `<button type="button" class="demo-skip" data-skip>Skip &raquo;</button>`;
const skipped = (el) => until(el, "[data-skip]");

// The whole onboarding gauntlet before the game starts.
export async function onboarding() {
  await signUp();
  await terms();
  await mathCheck();
}

async function signUp() {
  const el = modal(`
    <form class="window annoy-window signup" autocomplete="off">
      <div class="titlebar">Augustana Presidential Account Registration (Form PR-7)</div>
      <div class="rage-body">
        <p>Before taking office, you must create an Official Presidential Account.</p>
        <div class="rage-error" hidden></div>
        <label>Full legal name <input name="n1" /></label>
        <label>Username <input name="n2" /></label>
        <label>Password <input name="n3" type="password" /></label>
        <label>Confirm password <input name="n4" type="password" /></label>
        <p class="small">This is a fake form in a game. Don't use a real password; nothing here is saved.</p>
        <button type="submit">Create Account</button> ${SKIP}
      </div>
    </form>`);
  const form = el.querySelector("form");
  // First attempt never matches, whatever was typed. Second attempt always goes through.
  await new Promise((done) => {
    skipped(el).then(done);
    let tries = 0;
    form.onsubmit = (e) => {
      e.preventDefault();
      if (tries++ === 0) {
        const err = el.querySelector(".rage-error");
        err.textContent = "ERROR: Passwords do not match. Please re-enter ALL fields.";
        err.hidden = false;
        form.reset();
        form.querySelector("input").focus();
        form.classList.remove("wrong");
        void form.offsetWidth;
        form.classList.add("wrong");
        return;
      }
      done();
    };
  });
  el.remove();
}

const TERMS = [
  {
    title: "Terms of Office (Form TO-4)",
    scroll: true,
    body: `1. The President agrees to be blamed for everything.<br>2. The President agrees that the Slough is not a beverage.<br>3. The President waives all rights to dignity, effective immediately.<br>4. The Board of Trustees may call at any time, including during finals, sleep, or showers.<br>5. All decisions are final, except the ones the Board doesn't like.<br>6. The President acknowledges that Andreen does not have air conditioning and never will.<br>7. The President agrees not to wear tiger boxers on any balcony visible to the photo club.<br>8. Gerber Dining Center's meat is "meat." Do not ask follow-up questions.<br>9. Wild deer are considered staff for insurance purposes.<br>10. By scrolling this far, the President agrees to scroll this far.<br>11. The President acknowledges that Tredway Library's second floor is "probably fine."<br>12. Any similarity to an actual college is purely satirical.<br>13. There is no clause 13.<br>14. Seriously, there is no clause 13.<br>15. You have reached the bottom. Congratulations.`,
  },
  {
    title: "Privacy Policy (Rev. 1998)",
    body: "We collect nothing because our servers are a Gateway 2000 in a closet. Any data you provide will be printed, faxed to the Board, and stored in a filing cabinet in Old Main that has been locked since 1987.",
  },
  {
    title: "Slough Liability Waiver",
    body: "I, the undersigned President, understand that the Slough may flood, foam, freeze, contain sewage, contain a former president, or all of the above, and I agree not to sue anyone about it.",
  },
];

async function terms() {
  for (const [i, t] of TERMS.entries()) {
    const el = modal(`
      <div class="window annoy-window terms">
        <div class="titlebar">${t.title} (${i + 1} of ${TERMS.length})</div>
        <div class="rage-body">
          <div class="terms-text">${t.body}</div>
          ${t.scroll ? `<p class="small terms-hint">You must scroll to the bottom before you can agree.</p>` : ""}
          <label class="agree"><input type="checkbox" /> I have read and understood the above</label>
          <button data-agree disabled>I Agree</button> ${SKIP}
        </div>
      </div>`);
    const box = el.querySelector("input[type=checkbox]");
    const btn = el.querySelector("[data-agree]");
    const text = el.querySelector(".terms-text");
    let scrolled = !t.scroll;
    const update = () => (btn.disabled = !(box.checked && scrolled));
    text.addEventListener("scroll", () => {
      if (text.scrollTop + text.clientHeight >= text.scrollHeight - 4) {
        scrolled = true;
        el.querySelector(".terms-hint")?.remove();
        update();
      }
    });
    box.addEventListener("change", update);
    await Promise.race([until(el, "[data-agree]"), skipped(el)]);
    el.remove();
  }
}

// The Presidential Qualification Exam: "What is 5 - 3?" The only accepted answer is "1+1".
// After three wrong tries, let them through. Skipping it brands you a ROOKIE for the rest of the game.
async function mathCheck() {
  const el = modal(`
    <form class="window annoy-window math" autocomplete="off">
      <div class="titlebar">Presidential Qualification Exam (Question 1 of 1)</div>
      <div class="rage-body">
        <p class="small">Every President of Augustana College must pass this exam before taking office.</p>
        <p class="math-q">What is <b>5 &minus; 3</b>?</p>
        <div class="rage-error" hidden></div>
        <input name="a" />
        <button type="submit">Submit Answer</button> <button type="button" class="demo-skip" data-skip>Skip the exam &raquo;</button>
      </div>
    </form>`);
  const form = el.querySelector("form");
  const err = el.querySelector(".rage-error");
  await new Promise((done) => {
    let attempts = 0;
    skipped(el).then(async () => {
      err.className = "rage-error";
      err.textContent = "Exam skipped. You will be known as ROOKIE PRESIDENT for the rest of the semester.";
      err.hidden = false;
      document.body.classList.add("rookie");
      await sleep(1800);
      done();
    });
    form.onsubmit = async (e) => {
      e.preventDefault();
      attempts++;
      const answer = form.a.value.replace(/\s+/g, "");
      if (answer === "1+1") {
        err.className = "rage-ok";
        err.textContent = "Correct. Welcome, Madam/Mister President.";
        err.hidden = false;
        await sleep(900);
        return done();
      }
      if (attempts >= 3) {
        err.className = "rage-ok";
        err.textContent = "The correct answer was \"1 + 1\". Close enough. Proceeding.";
        err.hidden = false;
        await sleep(1600);
        return done();
      }
      err.className = "rage-error";
      err.textContent = `INCORRECT. ${form.a.value.trim() === "2" ? "\"2\" is not an acceptable format. " : ""}Please try again (attempt ${attempts + 1} of 3).`;
      err.hidden = false;
      form.reset();
      el.querySelector(".math").classList.remove("wrong");
      void el.offsetWidth;
      el.querySelector(".math").classList.add("wrong");
    };
  });
  el.remove();
}

const ADS = [
  { brand: "LAKE AUGUSTANA CONDOS", line: "Waterfront living. Do not smell the water.", art: "🏚️🌊💩", bg: "#2a6" },
  { brand: "TIGER BOXERS™", line: "As seen on a certain balcony. Now 40% off!", art: "🐯🩲✨", bg: "#f80" },
  { brand: "GERBER MYSTERY MEAT", line: "Now 95% soy! Probably not people!", art: "🍔❓🫘", bg: "#c33" },
  { brand: "HOT HARVARD PROFESSORS", line: "2 miles away and eager to teach at YOUR school.", art: "🎓😏📍", bg: "#a0f" },
  { brand: "CHASE BANK", line: "We heard your singing. We're still not okay.", art: "🏦🎤😬", bg: "#117aca" },
];

// An unskippable ad. Clicking Skip only makes it longer. Played before Finals Week.
export async function unskippableAd() {
  const ad = ADS[Math.floor(Math.random() * ADS.length)];
  let left = 8;
  const el = modal(`
    <div class="ad-player">
      <div class="ad-screen" style="background:${ad.bg}">
        <div class="ad-art">${ad.art}</div>
        <div class="ad-brand">${ad.brand}</div>
        <div class="ad-line">${ad.line}</div>
      </div>
      <div class="ad-bar"><span class="ad-tag">Ad · 1 of 1</span><span class="ad-time"></span><button class="ad-skip">Skip Ad &#9654;&#9646;</button></div>
      <div class="ad-progress"><div></div></div>
    </div>`);
  const time = el.querySelector(".ad-time");
  const skip = el.querySelector(".ad-skip");
  const bar = el.querySelector(".ad-progress div");
  const total = { v: left };
  skip.onclick = () => {
    left += 3;
    total.v += 3;
    skip.textContent = ["Nice try. +3s", "Still no. +3s", "Please enjoy the ad. +3s"][Math.floor(Math.random() * 3)];
    skip.style.transform = `translate(${Math.random() * 60 - 30}px, ${Math.random() * 20 - 10}px)`;
  };
  while (left > 0) {
    time.textContent = `0:${String(left).padStart(2, "0")}`;
    bar.style.width = `${((total.v - left) / total.v) * 100}%`;
    await sleep(1000);
    left--;
  }
  el.remove();
}

// Demo shortcut: a fixed "Skip Week" button. Using it brands you a NOOB.
export function mountSkipWeek(onSkip) {
  const b = document.createElement("button");
  b.className = "skip-week";
  b.innerHTML = "&#9197; Skip Week";
  b.hidden = true;
  b.onclick = async () => {
    b.disabled = true;
    document.body.classList.add("noob");
    const toast = document.createElement("div");
    toast.className = "noob-toast";
    toast.textContent = "WEEK SKIPPED. You are now officially a NOOB.";
    document.body.append(toast);
    setTimeout(() => toast.remove(), 1800);
    try {
      await onSkip();
    } finally {
      b.disabled = false;
    }
  };
  document.body.append(b);
  return { show: (on) => (b.hidden = !on) };
}
