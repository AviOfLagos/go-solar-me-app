import { useState } from "react";
import { track } from "@/lib/track";
import { View } from "react-native";
import { router } from "expo-router";
import { Button, Field, Row } from "@/ui";
import { resolveLink } from "@/lib/links";
import { errorMessage } from "@/lib/api";

/** Paste a link or code someone sent (an installer's list, a Go Solar Me page, a store) and open it. */
export function OpenLink({ label = "Got a link or code?", placeholder = "solar.nexprove.com/b/… or a code", onOpened }: { label?: string; placeholder?: string; onOpened?: () => void }) {
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const open = async () => {
    if (busy) return;
    setBusy(true); setErr("");
    try {
      const to = await resolveLink(text);
      track("link-opened");
      onOpened?.();
      router.push(to);
      setText("");
    } catch (e) { setErr(errorMessage(e)); }
    setBusy(false);
  };
  return (
    <Row style={{ alignItems: "flex-start" }}>
      <View style={{ flex: 1 }}>
        <Field label={label} value={text} onChangeText={(t) => { setText(t); setErr(""); }} placeholder={placeholder}
          autoCapitalize="none" autoCorrect={false} error={err} returnKeyType="go" onSubmitEditing={open} />
      </View>
      <Button small kind="ink" title="Open" busy={busy} onPress={open} style={{ marginTop: 26 }} />
    </Row>
  );
}
