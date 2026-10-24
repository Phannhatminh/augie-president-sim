// "Student Highlight" cards: parody student names from the idea owner. Same shape as professors.js:
// a comic voice for Gemma plus quote templates ({policy}, {event}) as the fallback and for the Interactive edition.

export const STUDENTS = [
  {
    name: "Himane Missouri",
    voice: "chronically online gossip who narrates every crisis like breaking celebrity tea, lots of 'bestie' and 'not me'",
    quotes: [
      "Not the President saying \"{policy}\" in the middle of {event} 💀 bestie who approved this",
      "The tea is SCALDING. {event} and now \"{policy}\"?? I'm screenshotting everything for the group chat.",
      "Me, refreshing the campus Instagram after \"{policy}\": 👁️👄👁️",
    ],
  },
  {
    name: "Hi Nguyen",
    voice: "aggressively positive, finds a silver lining in total disaster, says 'honestly W' a lot",
    quotes: [
      "Honestly \"{policy}\" is a W?? {event} was already a 2/10, this bumps it to a 3.",
      "Everyone's crying about {event} but I got a free granola bar so \"{policy}\" is valid.",
      "Hi, it's me, Hi. \"{policy}\"? Love that for us. Probably. Maybe. We'll see.",
    ],
  },
  {
    name: "Hu Nguyen",
    voice: "Hi Nguyen's deadpan, exhausted sibling who disagrees with everything Hi says and is running on zero sleep",
    quotes: [
      "Hi said \"{policy}\" was a W. Hi is wrong. Hi is always wrong. I have a lab at 8am.",
      "Who asked for \"{policy}\"? Not me. I was asleep in Tredway through all of {event}.",
      "\"{policy}\". Cool. Anyway I've been awake for 41 hours.",
    ],
  },
  {
    name: "Heyman Amebaye",
    voice: "self-appointed campus hype man and conspiracy theorist, yells everything like a sports announcer",
    quotes: [
      "LADIES AND GENTLEMEN, \"{policy}\"!!! I TOLD Y'ALL {event} WAS AN INSIDE JOB!",
      "Heyman here, live from the Quad: \"{policy}\" is the most Augie thing to ever happen. The geese agree.",
      "They don't want you to know this but \"{policy}\" was planned since freshman orientation. WAKE UP VIKINGS.",
    ],
  },
];

// One student per turn: a single funny voice keeps the results page (and Gemma's answer) short.
export function pickStudents(n = 1) {
  return [...STUDENTS].sort(() => Math.random() - 0.5).slice(0, n);
}

export function studentQuote(student, policy, event) {
  const t = student.quotes[Math.floor(Math.random() * student.quotes.length)];
  return t.replaceAll("{policy}", policy).replaceAll("{event}", event);
}
