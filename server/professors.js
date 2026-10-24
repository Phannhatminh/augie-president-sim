// "Professor Highlight" cards: parody faculty names from the idea owner. Each has a comic voice and
// quote templates; {policy} and {event} are filled in per turn. The Form edition asks Gemma to write
// in these voices and falls back to the templates.

export const PROFESSORS = [
  {
    name: "Broke Randazzo",
    voice: "always panicking about the department budget, which is somehow smaller every week",
    quotes: [
      "My department's budget is $4 and a stapler. And now \"{policy}\"? Who is paying for this?",
      "During {event}, I had to sell my office chair. \"{policy}\" will not get it back.",
      "I asked for a new projector in 2009. Instead we got \"{policy}\". Inspiring.",
    ],
  },
  {
    name: "Forrest G. Umpstone",
    voice: "speaks in folksy, slightly confused life wisdom, like a box of chocolates",
    quotes: [
      "Mama always said {event} is like a box of chocolates. \"{policy}\" is the one with the weird filling.",
      "I don't know much, but I know \"{policy}\" ain't how you fix {event}.",
      "I was runnin' to class during {event} and I just kept runnin'. Then I heard \"{policy}\". Kept runnin'.",
    ],
  },
  {
    name: "Stacey Madman",
    voice: "furious about everything, writes in near-constant ALL CAPS",
    quotes: [
      "\"{policy}\"?! DURING {event}?! I AM WRITING A STRONGLY WORDED EMAIL. IN ALL CAPS.",
      "I HAVE BEEN CALM ALL SEMESTER. \"{policy}\" HAS ENDED THAT.",
      "MY OFFICE HOURS ARE NOW A SCREAMING ROOM. THANK YOU FOR \"{policy}\".",
    ],
  },
  {
    name: "Robber Dickerson",
    voice: "a sly schemer who always wants a cut of whatever is happening",
    quotes: [
      "\"{policy}\"? Bold. I'll take 15% of whatever this makes.",
      "Nobody asked me, but I've already sold tickets to {event}. \"{policy}\" is great for business.",
      "I support \"{policy}\" if the check clears. My check. To me.",
    ],
  },
  {
    name: "Zhengyi Zhangya",
    voice: "calm and precise, grades every policy like a final exam with a letter grade",
    quotes: [
      "I have graded \"{policy}\". C-minus. It does not address {event}. Please see me after class.",
      "Your response to {event} shows effort but no citations. \"{policy}\": B-minus, generously.",
      "\"{policy}\". Incomplete. You may resubmit next week, with a works cited page.",
    ],
  },
  {
    name: "Midhi Nourya",
    voice: "wildly dramatic, turns every campus crisis into tragic poetry",
    quotes: [
      "O, {event}! O, \"{policy}\"! Never has a campus wept so beautifully.",
      "I wrote a sonnet about \"{policy}\". It is fourteen lines of screaming.",
      "The sun set on {event}, and with it, my hope. \"{policy}\". How poetic. How tragic.",
    ],
  },
];

// 1 or 2 different professors for this week.
export function pickProfessors() {
  const pool = [...PROFESSORS].sort(() => Math.random() - 0.5);
  return pool.slice(0, Math.random() < 0.5 ? 1 : 2);
}

export function templateQuote(prof, policy, event) {
  const t = prof.quotes[Math.floor(Math.random() * prof.quotes.length)];
  return t.replaceAll("{policy}", policy).replaceAll("{event}", event);
}
