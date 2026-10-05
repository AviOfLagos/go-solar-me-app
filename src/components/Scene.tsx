import { View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Path, Polygon, Rect, Stop } from "react-native-svg";
import { colors } from "@/theme";

export type SceneKind = "home" | "gift" | "group" | "pro" | "night";

/** A house with panels on the roof, drawn at the origin (about 190 × 150) and placed with transform. */
function House({ transform, glow = colors.lemon, panels = true }: { transform?: string; glow?: string; panels?: boolean }) {
  return (
    <G transform={transform}>
      {/* walls */}
      <Rect x={14} y={62} width={160} height={92} fill="#FFFDF6" />
      <Rect x={14} y={62} width={160} height={8} fill="#E9E6DA" />
      {/* roof */}
      <Polygon points="0,68 94,6 188,68" fill={colors.night} />
      <Polygon points="0,68 94,6 188,68 184,68 94,10 4,68" fill="#3A4840" />
      {panels ? (
        <G>
          {[
            ...[64, 84, 104].map((x) => [x, 30]),
            ...[44, 64, 84, 104, 124].map((x) => [x, 43]),
          ].map(([x, y]) => (
            <G key={`${x}-${y}`}>
              <Rect x={x} y={y} width={18} height={11} rx={1.5} fill="#3E5A73" />
              <Rect x={x} y={y} width={18} height={3} rx={1.5} fill="#7E9DB5" opacity={0.75} />
            </G>
          ))}
        </G>
      ) : null}
      {/* windows and door */}
      <Rect x={32} y={90} width={36} height={32} rx={4} fill={glow} />
      <Rect x={49} y={90} width={2} height={32} fill="#FFFDF6" />
      <Rect x={120} y={90} width={36} height={32} rx={4} fill={glow} />
      <Rect x={137} y={90} width={2} height={32} fill="#FFFDF6" />
      <Rect x={82} y={102} width={26} height={52} rx={3} fill={colors.nightSoft} />
      <Circle cx={102} cy={130} r={2} fill={colors.mint} />
    </G>
  );
}

function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x},${y}) scale(${s})`}>
      <Rect x={-3} y={10} width={6} height={30} rx={3} fill="#6B5B45" />
      <Circle cx={0} cy={0} r={22} fill={colors.mintDeep} />
      <Circle cx={-9} cy={-6} r={11} fill="#3E9563" opacity={0.8} />
    </G>
  );
}

/**
 * The illustration at the top of welcome and home screens: a calm scene with a house powered by
 * the sun. Each kind of person gets a small variation (a gift, a row of homes, panels on the ground).
 */
export function Scene({ kind = "home", height = 220, style }: { kind?: SceneKind; height?: number; style?: StyleProp<ViewStyle> }) {
  const dark = kind === "night";
  return (
    <View style={[{ height, borderRadius: 28, overflow: "hidden" }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%" viewBox="0 0 360 240" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={dark ? "#1D2621" : colors.lemonTint} />
            <Stop offset="1" stopColor={dark ? "#2A3A31" : colors.mintTint} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={360} height={240} fill="url(#sky)" />
        {/* sun (or moon) */}
        <Circle cx={292} cy={58} r={42} fill={dark ? "#3A4A40" : colors.lemon} opacity={0.55} />
        <Circle cx={292} cy={58} r={26} fill={dark ? "#E8F0C0" : "#F6E66B"} />
        {/* hills */}
        <Path d="M0 196 C 70 170, 150 182, 210 192 S 320 176, 360 186 L 360 240 L 0 240 Z" fill={dark ? "#2F4A3A" : colors.mint} />
        <Path d="M0 214 C 90 200, 200 216, 360 204 L 360 240 L 0 240 Z" fill={dark ? "#263C2F" : "#A7E38D"} />

        {kind === "group" ? (
          <>
            <House transform="translate(14,112) scale(0.5)" />
            <House transform="translate(116,74) scale(0.72)" glow={colors.lemon} />
            <House transform="translate(262,118) scale(0.46)" />
          </>
        ) : kind === "pro" ? (
          <>
            <House transform="translate(150,70) scale(0.78)" />
            {/* ground-mount panel rows */}
            {[0, 1, 2].map((i) => (
              <G key={i} transform={`translate(${22 + i * 40},${170 + (i % 2) * 4}) skewX(-18)`}>
                <Rect x={0} y={0} width={34} height={20} rx={2} fill="#3E5A73" />
                <Rect x={0} y={0} width={34} height={5} rx={2} fill="#6F8FA8" opacity={0.6} />
                <Rect x={14} y={20} width={4} height={12} fill="#7A8A80" />
              </G>
            ))}
          </>
        ) : (
          <>
            <House transform="translate(86,62) scale(0.95)" glow={dark ? "#F6E66B" : colors.lemon} />
            <Tree x={66} y={170} />
            {kind === "gift" ? (
              <G transform="translate(282,170)">
                <Rect x={0} y={10} width={40} height={32} rx={4} fill={colors.lemon} />
                <Rect x={-3} y={4} width={46} height={10} rx={3} fill="#F0E57A" />
                <Rect x={17} y={4} width={6} height={38} fill={colors.mintDeep} />
                <Path d="M20 4 C 8 -8, 2 2, 20 4 C 38 2, 32 -8, 20 4" fill={colors.mintDeep} />
              </G>
            ) : null}
          </>
        )}
      </Svg>
    </View>
  );
}
