// Design tokens, matching src/app/globals.css in solar-builders-ng.
export const colors = {
  ink: "#10213B",
  ink2: "#3A4B63",
  mute: "#5B6B80",
  haze: "#E9EEF2",
  paper: "#FFFFFF",
  line: "#D5DEE6",
  sun: "#FFC21A",
  sunDeep: "#E89B00",
  sunTint: "#FFF3CC",
  leaf: "#0E8A5F",
  leafTint: "#E2F3EC",
  flare: "#E5482D",
  flareTint: "#FCE6E1",
} as const;

export const fonts = {
  display: "BricolageGrotesque_600SemiBold",
  displayBold: "BricolageGrotesque_800ExtraBold",
  sans: "InstrumentSans_400Regular",
  sansMedium: "InstrumentSans_500Medium",
  sansSemiBold: "InstrumentSans_600SemiBold",
  sansBold: "InstrumentSans_700Bold",
} as const;

export const radii = { input: 10, card: 16, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
/** Minimum touch target (Apple HIG / WCAG). */
export const MIN_TOUCH = 44;
