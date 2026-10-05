// Design tokens. See docs/DESIGN.md. Old names (sun, haze, paper…) are kept so every screen
// picks up the new look; new names (mint, lemon, night…) are for new work.
export const colors = {
  ink: "#17201B",
  ink2: "#3B4540",
  mute: "#6E7670",
  haze: "#F3F2EC", // screen background
  paper: "#FFFFFF",
  line: "#E5E3DB",
  // Brand accent: mint (was sun yellow)
  sun: "#BDF0A6",
  sunDeep: "#2F7D4F",
  sunTint: "#EBF8E3",
  mint: "#BDF0A6",
  mintDeep: "#2F7D4F",
  mintTint: "#EBF8E3",
  lemon: "#F4F1A8",
  lemonTint: "#FBFAE3",
  night: "#1D2621",
  nightSoft: "#2A3530",
  leaf: "#2F7D4F",
  leafTint: "#E3F4E6",
  flare: "#C9432A",
  flareTint: "#FBE9E4",
} as const;

export const fonts = {
  light: "Manrope_300Light",
  display: "Manrope_600SemiBold",
  displayBold: "Manrope_700Bold",
  sans: "Manrope_400Regular",
  sansMedium: "Manrope_500Medium",
  sansSemiBold: "Manrope_600SemiBold",
  sansBold: "Manrope_700Bold",
} as const;

export const radii = { input: 14, button: 16, card: 24, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
/** Minimum touch target (Apple HIG / WCAG). */
export const MIN_TOUCH = 44;
/** Room left under scrolling content for the floating tab bar. */
export const TAB_SPACE = 112;
