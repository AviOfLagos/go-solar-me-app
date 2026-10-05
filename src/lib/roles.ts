import type { Ionicons } from "@expo/vector-icons";

type IconName = keyof typeof Ionicons.glyphMap;

export type Role = "home" | "gift" | "group" | "pro";

/** The four reasons people open the app. Each gets its own home screen and default way to pay. */
export const ROLES: { key: Role; icon: IconName; title: string; sub: string }[] = [
  { key: "home", icon: "home-outline", title: "Power my home or business", sub: "Find the right kit and stop buying fuel." },
  { key: "gift", icon: "gift-outline", title: "Get solar for someone", sub: "Family or a friend in Lagos. Pay from anywhere." },
  { key: "group", icon: "people-outline", title: "Raise or split the cost", sub: "Friends chip in, split with your squad, or pay small small." },
  { key: "pro", icon: "construct-outline", title: "I install or resell solar", sub: "Build equipment lists, send them to clients, earn on every sale." },
];

export const roleTitle = (r: Role | null) => ROLES.find((x) => x.key === r)?.title ?? "Not chosen yet";

/** Ways to pay for a kit, in the order each kind of person usually wants them. */
export type PayPath = "share" | "now" | "someone" | "fund" | "squad" | "gift" | "small";
export const PATH_ORDER: Record<Role, PayPath[]> = {
  home: ["now", "small", "squad", "fund", "someone", "gift", "share"],
  gift: ["someone", "gift", "now", "fund", "squad", "small", "share"],
  group: ["fund", "squad", "small", "now", "someone", "gift", "share"],
  pro: ["share", "now", "someone", "small", "fund", "squad", "gift"],
};
