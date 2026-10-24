// Game content. Placeholder events/personas: replace with the idea owner's list.

// Reactors, divided into subgroups. Each subgroup has its own approval rating.
export const SUBGROUPS = [
  {
    id: "students",
    name: "Students",
    personas: [
      { id: "premed", name: "Priya, stressed pre-med junior", cares: "grades, sleep, MCAT, library hours" },
      { id: "athlete", name: "Jake, Viking football lineman", cares: "athletics, dining portions, game days" },
      { id: "intl", name: "Linh, international CS student", cares: "visas, tuition, housing over breaks, inclusion" },
      { id: "firstyear", name: "Emma, homesick first-year", cares: "friends, dorm life, feeling safe, free food" },
    ],
  },
  {
    id: "faculty",
    name: "Faculty",
    personas: [
      { id: "prof", name: "Dr. Halvorsen, tenured history professor", cares: "academic freedom, shared governance, tradition" },
      { id: "adjunct", name: "Prof. Reyes, overworked adjunct", cares: "pay, job security, class sizes" },
    ],
  },
  {
    id: "staff",
    name: "Staff",
    personas: [
      { id: "facilities", name: "Dave, facilities crew lead", cares: "workload, safety, being consulted, overtime" },
      { id: "dining", name: "Rosa, dining hall manager", cares: "supplies, staffing, student complaints" },
    ],
  },
  {
    id: "alumni",
    name: "Alumni & Donors",
    personas: [{ id: "donor", name: "Carol, class of '79 alum donor", cares: "prestige, tradition, Lutheran heritage" }],
  },
  {
    id: "parents",
    name: "Parents",
    personas: [{ id: "parent", name: "Mike, tuition-paying parent", cares: "cost, safety, job outcomes" }],
  },
  {
    id: "board",
    name: "Board of Trustees",
    personas: [{ id: "trustee", name: "Chair of the Board of Trustees", cares: "budget, reputation, enrollment, liability" }],
  },
];

export const PERSONAS = SUBGROUPS.flatMap((g) => g.personas.map((p) => ({ ...p, group: g.id })));

export const OUTLETS = [
  { id: "observer", name: "The Augustana Observer", slant: "earnest student journalism, a bit idealistic" },
  { id: "dispatch", name: "Quad-City Dispatch", slant: "local news, cares about town-gown relations" },
  { id: "memes", name: "@augie.confessions", slant: "chaotic anonymous meme account, all caps energy" },
];

// The semester-long arc every week hangs off of.
export const PREMISE = `You are the brand-new President of Augustana College, hired in a hurry after your predecessor resigned under mysterious circumstances involving the Slough. The college is running a budget deficit, enrollment is down, and the Board of Trustees has made it clear: get through the fall semester with the campus still behind you, or you're out by Christmas.`;

// Fall semester: 9 weeks of classes + finals week.
export const CLASS_WEEKS = 9;
export const TERM_WEEKS = CLASS_WEEKS + 1;
export const MIDTERM_WEEK = 5;
export const RANDOMIZE_EVENTS = false; // shuffle the class-week events each new game

// The owner's 10-week schedule. Annoyances for these weeks live in public/annoyances.js.
export const EVENTS = [
  { title: "Heatwave & Power Outage", severity: "emergency", body: "109°F heat hits Rock Island. Students blast their dorm ACs at once and the power grid for the ACs explodes. Andreen Hall catches fire from the heat (as it doesn't have AC)." },
  { title: "Hangover Monday", severity: "high", body: "A massive off-campus party leaves dozens of students sick with alcohol poisoning. No one shows up to Monday classes, and the Slough is foaming with blue punch." },
  { title: "The Gerber Meat Rumor", severity: "high", body: "A student worker claims Gerber Dining Center is cooking with human meat. The rumor goes viral and students panic." },
  { title: "The Photo Leak & Phishing Scam", severity: "emergency", body: "The photo club catches you dancing on your balcony in tiger boxers and posts it online. At the same time, hackers break into your office computer." },
  { title: "Midterm Favors & Empty Bank Accounts", severity: "high", body: "Desperate for good midterm grades, students start doing crazy chores for professors, like washing faculty cars at midnight and grooming hairless cats. Meanwhile, the hack drained the school funds." },
  { title: "Rat Swarms & Wild Deer", severity: "high", body: "Trash bins are completely overrun by giant rats, so nobody can throw garbage out. Wild deer start walking into campus buildings and chewing through Wi-Fi cables." },
  { title: "The Slough Sewer Break", severity: "emergency", body: "A sewage pipe bursts straight into the Slough, poop everywhere. A terrible smell covers the lower campus, making the walkway unlivable." },
  { title: "The Blizzard & Bigfoot", severity: "emergency", body: "Four feet of snow traps students inside their dorms. Trapped freshmen start burning class syllabi for warmth." },
  { title: "Tredway Library Floor Collapse", severity: "emergency", body: "Panicked cramming packs Tredway Library with way too many students. The heavy weight of old books and crowds causes the second floor to fall down onto the study tables below." },
];

export const FINALS_EVENT = { title: "Finals Week: The Quad Strike", severity: "emergency", body: "Starving, tired, and stressed out, students protest on the lower Quad and refuse to take any final exams." };

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function newGame() {
  const order = EVENTS.map((_, i) => i);
  return {
    week: 1,
    approval: 50,
    groups: Object.fromEntries(SUBGROUPS.map((g) => [g.id, 50])),
    eventOrder: RANDOMIZE_EVENTS ? shuffle(order) : order,
    history: [], // { week, event, policy, summary }
    pendingFallout: [], // { week, memo }
    story: PREMISE, // running story-so-far, rewritten by Gemma each week
    lastQuotes: {}, // personaId -> what they said last week, so characters stay consistent
    orderNo: 1,
  };
}

// The raw event seed for a week, before Gemma weaves it into the story.
export function eventForWeek(state, week = state.week) {
  return week > CLASS_WEEKS ? FINALS_EVENT : EVENTS[state.eventOrder[week - 1]];
}
