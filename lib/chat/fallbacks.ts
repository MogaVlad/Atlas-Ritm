/**
 * Offline answers for "Ask Ritm": used when there is no API key, on any error or after the timeout.
 * Matched by keywords, in Romanian and English. Same rules as the chatbot: short, never decides for the user.
 */

export type ChatLocale = "ro" | "en";

type Topic = "pension" | "pause" | "unlock" | "ritm" | "other";

const ANSWERS: Record<Topic, Record<ChatLocale, string>> = {
  ritm: {
    ro: "Ritm urmărește cât de repede cheltui banii de buzunar de la salariu încoace. La nivelul ales de tine, te anunță (Heads-up), pune o pauză scurtă la plățile online (Speed bump) sau blochează o parte din salariu în economii (Lock). Îl poți opri oricând din setări.",
    en: "Ritm watches how fast you spend your spending money since payday. At the level you choose, it gives you a Heads-up, adds a short pause to online payments (Speed bump) or locks part of your salary in savings (Lock). You can turn it off any time in settings.",
  },
  pause: {
    ro: "Pauza apare la plățile online de peste 100 RON când cheltui mai repede decât de obicei. Îți arată ce înseamnă plata pentru obiectivul tău și cât poți cheltui azi; după 5 secunde poți confirma. Decizia rămâne a ta.",
    en: "The pause shows up on online payments over 100 RON when you spend faster than usual. It shows what the payment means for your goal and how much is safe to spend today; after 5 seconds you can confirm. The choice is yours.",
  },
  pension: {
    ro: "Pilonul III e o pensie privată facultativă: banii rămân investiți până la pensie, iar contribuțiile sunt deductibile până la echivalentul a 400 EUR pe an. Atlas Pensii este fondul propriu al Atlas; poți compara toate fondurile pe site-ul ASF.",
    en: "Pillar III is a voluntary private pension: the money stays invested until retirement, and contributions are deductible up to the RON equivalent of 400 EUR a year. Atlas Pensii is Atlas's own fund; you can compare all funds on the ASF website.",
  },
  unlock: {
    ro: "Lock se deblochează singur în ziua aleasă. Poți cere deblocarea mai devreme și banii vin după 24 de ore, iar o dată pe lună poți scoate imediat până la 300 RON pentru o urgență.",
    en: "The Lock opens by itself on the day you chose. You can ask to unlock early and the money arrives after 24 hours, and once a month you can take out up to 300 RON right away for an emergency.",
  },
  other: {
    ro: "Te pot ajuta doar cu Ritm și cu banii din această aplicație. Întreabă-mă, de exemplu, ce este Ritm, de ce a apărut pauza sau ce este Pilonul III.",
    en: "I can only help with Ritm and the money in this app. Try asking what Ritm is, why the pause appeared or what Pillar III is.",
  },
};

/** Checked in order: the first topic with a matching keyword wins. */
const KEYWORDS: [Topic, string[]][] = [
  ["pension", ["pilon", "pillar", "pensi", "pension", "asf"]],
  ["unlock", ["deblo", "unlock", "lock", "seif", "urgent", "emergency", "scot", "withdraw"]],
  ["pause", ["pauz", "pause", "speed bump", "speedbump", "de ce", "why", "confirm", "astept", "wait"]],
  ["ritm", ["ritm", "heads-up", "headsup", "cum functioneaza", "how does", "what is", "ce este", "ce e"]],
];

const RO_HINTS = ["ce ", "cum ", "de ce", "este", "pot ", "banii", "pauz", "pensi", "deblo", "vreau", "si ", "nu "];

/** Lowercase, no diacritics (ș → s, ă → a), single spaces. */
function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Romanian if the text has Romanian letters or common Romanian words, otherwise the given default. */
export function detectLocale(input: string, fallback: ChatLocale = "ro"): ChatLocale {
  if (/[ăâîșşțţ]/i.test(input)) return "ro";
  const t = ` ${normalize(input)} `;
  if (RO_HINTS.some((h) => t.includes(` ${h}`))) return "ro";
  if (/\b(what|why|how|is|the|can|my|money|i)\b/.test(t)) return "en";
  return fallback;
}

export function matchTopic(input: string): Topic {
  const t = normalize(input);
  for (const [topic, words] of KEYWORDS) {
    if (words.some((w) => t.includes(w))) return topic;
  }
  return "other";
}

/** A short offline answer to the user's question, in their language. */
export function fallbackAnswer(question: string, locale?: ChatLocale): string {
  return ANSWERS[matchTopic(question)][locale ?? detectLocale(question)];
}
