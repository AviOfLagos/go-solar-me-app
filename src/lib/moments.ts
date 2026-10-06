import { naira } from "@/shared/format";
import type { Pool } from "./types";

export type Moment = "launch" | "p25" | "p50" | "p75" | "last" | "thanks";
export type Channel = "whatsapp" | "instagram" | "x";

export const MOMENTS: { key: Moment; label: string; note: string }[] = [
  { key: "launch", label: "Launch", note: "Ask for the first chip-ins" },
  { key: "p25", label: "25%", note: "A quarter there" },
  { key: "p50", label: "Halfway", note: "Keep the push going" },
  { key: "p75", label: "75%", note: "Nearly there" },
  { key: "last", label: "Last push", note: "The final stretch" },
  { key: "thanks", label: "Thank you", note: "After it's funded" },
];
export const CHANNELS: { key: Channel; label: string }[] = [{ key: "whatsapp", label: "WhatsApp" }, { key: "instagram", label: "Instagram" }, { key: "x", label: "X" }];

/** The moment that fits this page right now, so the sheet opens on the right caption. */
export function currentMoment(p: Pick<Pool, "status" | "raised" | "goal">): Moment {
  if (p.status === "funded") return "thanks";
  const pct = Math.floor((p.raised / p.goal) * 100);
  if (pct >= 90) return "last";
  if (pct >= 75) return "p75";
  if (pct >= 50) return "p50";
  if (pct >= 25) return "p25";
  return "launch";
}

/** Highest 25/50/75 milestone reached, or 0. Used to prompt a fresh post once per milestone. */
export const milestone = (p: Pick<Pool, "raised" | "goal">) => {
  const pct = Math.floor((p.raised / p.goal) * 100);
  return pct >= 75 ? 75 : pct >= 50 ? 50 : pct >= 25 ? 25 : 0;
};

/** Ready-to-post words for a moment on a channel. Short on X, with tags on Instagram, plain on WhatsApp. */
export function caption(m: Moment, c: Channel, p: Pick<Pool, "title" | "raised" | "goal" | "kind">, link: string, supporters: number): string {
  const left = naira(Math.max(0, p.goal - p.raised));
  const body: Record<Moment, string> = {
    launch: p.kind === "squad" ? `We're splitting a solar kit for "${p.title}". Pay your share, it takes a minute.` : `I'm raising for a solar kit: "${p.title}". Chip in any amount and help me beat the generator.`,
    p25: `A quarter of the way there for "${p.title}"! ${naira(p.raised)} raised so far. Every bit counts.`,
    p50: `Halfway! ${naira(p.raised)} of ${naira(p.goal)} for "${p.title}". Help me close the other half.`,
    p75: `75% funded for "${p.title}". Only ${left} to go. Can you chip in?`,
    last: `Last push for "${p.title}": just ${left} to go. Even ₦1,000 gets us there.`,
    thanks: `We did it! "${p.title}" is fully funded${supporters ? ` by ${supporters} ${supporters === 1 ? "person" : "people"}` : ""}. Thank you, you made the lights come on.`,
  };
  const t = body[m];
  if (c === "instagram") return `${t}\n\nLink in bio: ${link}\n\n#GoSolarMe #SolarNigeria #SolarBuildersNG`;
  if (c === "x") return `${t.length > 200 ? t.slice(0, 197) + "…" : t} ${link}`;
  return `${t}\n${link}`;
}
