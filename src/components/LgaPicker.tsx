import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Label, Small } from "@/ui";
import { LAGOS_LGAS } from "@/shared/store";
import { colors, fonts } from "@/theme";

/** Lagos LGA as a field that opens a short searchable list, instead of 20 chips on screen. */
export function LgaPicker({ value, onChange, error, label = "Local government area" }: { value: string; onChange: (v: string) => void; error?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const list = useMemo(() => LAGOS_LGAS.filter((l) => l.toLowerCase().includes(q.trim().toLowerCase())), [q]);
  return (
    <View style={{ gap: 6 }}>
      <Label>{label}</Label>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityLabel={label}
        style={{ minHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: error ? colors.flare : open ? colors.ink : colors.line, backgroundColor: colors.paper, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" }}>
        <Text style={{ flex: 1, fontFamily: fonts.sansMedium, fontSize: 16, color: value ? colors.ink : colors.mute }}>{value || "Choose the LGA"}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.mute} />
      </Pressable>
      {open ? (
        <View style={{ backgroundColor: colors.paper, borderRadius: 18, padding: 8, gap: 4 }}>
          <TextInput value={q} onChangeText={setQ} placeholder="Search, e.g. Ikeja" placeholderTextColor={colors.mute} autoCorrect={false}
            style={{ minHeight: 44, borderRadius: 12, backgroundColor: colors.haze, paddingHorizontal: 12, fontFamily: fonts.sansMedium, color: colors.ink }} />
          <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {list.map((l) => (
              <Pressable key={l} onPress={() => { onChange(l); setOpen(false); setQ(""); }} style={{ minHeight: 44, paddingHorizontal: 10, justifyContent: "center", borderRadius: 10, backgroundColor: value === l ? colors.mintTint : "transparent" }}>
                <Text style={{ fontFamily: value === l ? fonts.sansBold : fonts.sansMedium, color: colors.ink }}>{l}</Text>
              </Pressable>
            ))}
            {!list.length ? <Small style={{ padding: 10 }}>We deliver within Lagos only.</Small> : null}
          </ScrollView>
        </View>
      ) : null}
      {error ? <Small style={{ color: colors.flare }}>{error}</Small> : <Small>We deliver free anywhere in Lagos.</Small>}
    </View>
  );
}
