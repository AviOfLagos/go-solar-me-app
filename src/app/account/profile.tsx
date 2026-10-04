import { useState } from "react";
import { Stack, router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card, ErrorBox, Field, H3, Loading, Notice, P, Screen, Small } from "@/ui";
import { useMe } from "@/lib/me";
import { api, ApiError, errorMessage } from "@/lib/api";
import { unregisterPush } from "@/lib/push";
import { signOutGoogle } from "@/lib/signin";
import { useAuth } from "@/stores/auth";
import { useCart } from "@/stores/cart";

export default function Profile() {
  const me = useMe();
  const qc = useQueryClient();
  const [f, setF] = useState({ name: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [confirm, setConfirm] = useState("");

  // Fill the form when the profile loads (or changes on the server).
  const [loaded, setLoaded] = useState<unknown>(null);
  if (me.data?.user && loaded !== me.data.user) {
    setLoaded(me.data.user);
    setF({ name: me.data.user.name, phone: me.data.user.phone });
  }

  if (me.isPending) return <Screen edges={[]}><Loading /></Screen>;
  if (me.error || !me.data?.user) return <Screen edges={[]}><ErrorBox message={me.error?.message ?? "Sign in first."} /></Screen>;

  const save = async () => {
    setBusy("save"); setErr(""); setMsg("");
    try {
      await api("/me", { method: "PATCH", body: f });
      setMsg("Saved.");
      void qc.invalidateQueries({ queryKey: ["me"] });
      const u = useAuth.getState().user;
      if (u) useAuth.setState({ user: { ...u, name: f.name } });
    } catch (x) { if (x instanceof ApiError) setErrors(x.fields); setErr(errorMessage(x)); }
    setBusy("");
  };

  const remove = async () => {
    setBusy("delete"); setErr("");
    try {
      await unregisterPush();
      await api("/me", { method: "DELETE", body: { confirm: "DELETE" } });
      await signOutGoogle();
      await useAuth.getState().signOut();
      useCart.getState().clear();
      router.dismissAll();
      router.replace("/(tabs)");
    } catch (x) { setErr(errorMessage(x)); setBusy(""); }
  };

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: "Profile" }} />
      <Card>
        <Field label="Full name" value={f.name} onChangeText={(t) => { setF({ ...f, name: t }); setErrors({}); }} error={errors.name} autoComplete="name" />
        <Field label="Phone" value={f.phone} onChangeText={(t) => { setF({ ...f, phone: t }); setErrors({}); }} error={errors.phone} keyboardType="phone-pad" />
        <Small>Email: {me.data.user.email} (this can't change)</Small>
        {msg ? <Notice tone="leaf">{msg}</Notice> : null}
        <Button title="Save" kind="ink" busy={busy === "save"} onPress={save} />
      </Card>
      <Card>
        <H3>Delete account</H3>
        <P>Your details, saved cards and phone notifications are removed. Open Go Solar Me pages are closed and every supporter is refunded. Past orders stay in our records without your name.</P>
        <Field label='Type DELETE to confirm' value={confirm} onChangeText={setConfirm} autoCapitalize="characters" autoCorrect={false} />
        <Button title="Delete my account" kind="danger" disabled={confirm.trim() !== "DELETE"} busy={busy === "delete"} onPress={remove} />
      </Card>
      {err ? <ErrorBox message={err} /> : null}
    </Screen>
  );
}
