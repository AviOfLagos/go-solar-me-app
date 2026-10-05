import { useState } from "react";
import { View } from "react-native";
import { Button, Field, Small } from "@/ui";
import { shareList } from "@/lib/builds";
import { errorMessage } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { Line } from "@/stores/cart";

/** Name the list (optional) and share its link. Whoever opens it sees today's prices and can buy. */
export function ShareList({ items, kind = "ghost" }: { items: Line[]; kind?: "ghost" | "ink" | "sun" }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const go = async () => {
    if (busy) return;
    setBusy(true); setMsg("");
    try {
      await shareList(items, title);
      void qc.invalidateQueries({ queryKey: ["myBuilds"] });
      setOpen(false); setTitle("");
    } catch (e) { setMsg(errorMessage(e)); }
    setBusy(false);
  };
  if (!open) return <Button kind={kind} title="Share this list" onPress={() => setOpen(true)} />;
  return (
    <View style={{ gap: 8 }}>
      <Field label="Name it (optional)" value={title} onChangeText={setTitle} placeholder="e.g. Mr Ade's 5kVA quote" maxLength={80} />
      <Button kind="ink" title="Get link and share" busy={busy} onPress={go} />
      {msg ? <Small style={{ color: "#E5482D" }}>{msg}</Small> : <Small>They see the items with today's prices and can pay any way they like.</Small>}
    </View>
  );
}
