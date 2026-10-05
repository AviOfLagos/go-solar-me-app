import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { Ionicons } from "@expo/vector-icons";
import { Small } from "@/ui";
import { APPLE_READY } from "@/lib/config";
import { colors, fonts, radii } from "@/theme";

/** Google's four-colour "G", drawn with text so no image or SVG library is needed. */
function GoogleG() {
  const letters: [string, string][] = [["G", "#4285F4"]];
  return (
    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" }}>
      {letters.map(([l, c]) => <Text key={l} style={{ fontFamily: fonts.sansBold, fontSize: 18, color: c, lineHeight: 22 }}>{l}</Text>)}
    </View>
  );
}

function Social({ icon, title, onPress, busy, dark, disabled, badge }: {
  icon: React.ReactNode; title: string; onPress: () => void; busy?: boolean; dark?: boolean; disabled?: boolean; badge?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 54, borderRadius: radii.button, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
        backgroundColor: dark ? "#000" : colors.paper, borderWidth: 0,
        opacity: disabled ? 0.45 : busy || pressed ? 0.75 : 1, paddingHorizontal: 16,
      })}
    >
      {icon}
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 16, color: dark ? "#fff" : colors.ink }}>{busy ? "One moment…" : title}</Text>
      {badge ? (
        <View style={{ backgroundColor: colors.sunTint, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.ink }}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Google and Apple buttons. Apple shows as "Coming soon" until the Apple Developer account is set up. */
export function AuthButtons({ busy, onGoogle, onApple, appleAvailable }: {
  busy: string; onGoogle: () => void; onApple: () => void; appleAvailable: boolean;
}) {
  const [appleHint, setAppleHint] = useState(false);
  const appleLive = APPLE_READY && Platform.OS === "ios" && appleAvailable;
  return (
    <View style={{ gap: 10 }}>
      <Social icon={<GoogleG />} title="Continue with Google" busy={busy === "google"} onPress={onGoogle} />
      {appleLive ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={16}
          style={{ height: 54 }}
          onPress={onApple}
        />
      ) : (
        <>
          <Social dark disabled icon={<Ionicons name="logo-apple" size={20} color="#fff" />} title="Continue with Apple" badge="Soon" onPress={() => setAppleHint(true)} />
          {appleHint ? <Small style={{ textAlign: "center" }}>Apple sign-in is coming soon. Use Google or email for now.</Small> : null}
        </>
      )}
    </View>
  );
}
