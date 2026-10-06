import { useState } from "react";
import { Modal, Pressable, ScrollView, Share, TextInput, View } from "react-native";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Chip, H2, Label, Notice, Row, Small } from "@/ui";
import { API_BASE, SITE } from "@/lib/config";
import { sharePicture } from "@/lib/share";
import { CHANNELS, MOMENTS, caption, currentMoment, type Channel, type Moment } from "@/lib/moments";
import { track } from "@/lib/track";
import { colors, fonts } from "@/theme";
import type { Pool } from "@/lib/types";

/**
 * Pick the moment, see the picture, edit the words, post. The caption is copied first because a phone's share
 * sheet takes a picture or words but not both, so people paste it under the picture.
 */
export function ShareSheet({ p, visible, onClose, start }: { p: Pool; visible: boolean; onClose: (shared?: boolean) => void; start?: Moment }) {
  const [moment, setMoment] = useState<Moment>(start ?? currentMoment(p));
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const link = `${SITE}/fund/${p.id}`;
  const generated = caption(moment, channel, p, link, p.supporters.length);
  // Typing keeps your own words; picking another moment or channel brings back the written ones.
  const [edited, setEdited] = useState<string | null>(null);
  const text = edited ?? generated;
  const setText = setEdited;
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const pickMoment = (m: Moment) => { setMoment(m); setEdited(null); setNote(""); };
  const pickChannel = (c: Channel) => { setChannel(c); setEdited(null); setNote(""); };

  const preview = `${API_BASE}/share/pool/${encodeURIComponent(p.id)}?f=story&v=${p.raised}-${p.status}`;
  const picture = async () => {
    if (busy) return;
    setBusy(true);
    await Clipboard.setStringAsync(text).catch(() => {});
    setNote("Caption copied. Paste it with your picture.");
    track(`share-picture-${moment}-${channel}`);
    await sharePicture("pool", p.id, text, link).catch(() => {});
    setBusy(false);
    onClose(true);
  };
  const words = async () => {
    track(`share-words-${moment}-${channel}`);
    await Share.share({ message: text }).catch(() => {});
    onClose(true);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => onClose()}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.haze }}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
          <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
            <H2>Share your page</H2>
            <Pressable onPress={() => onClose()} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10}><Small style={{ fontFamily: fonts.sansBold }}>Close</Small></Pressable>
          </Row>

          <Label>When are you posting?</Label>
          <Row style={{ flexWrap: "wrap" }}>
            {MOMENTS.map((m) => <Chip key={m.key} label={m.label} on={moment === m.key} onPress={() => pickMoment(m.key)} />)}
          </Row>
          <Small>{MOMENTS.find((m) => m.key === moment)?.note}</Small>

          <View style={{ alignItems: "center" }}>
            <Image source={{ uri: preview }} style={{ width: 200, height: 356, borderRadius: 20, backgroundColor: colors.paper }} contentFit="cover" transition={150} accessibilityLabel="Preview of your picture" />
          </View>

          <Label>Where?</Label>
          <Row>{CHANNELS.map((c) => <Chip key={c.key} label={c.label} on={channel === c.key} onPress={() => pickChannel(c.key)} />)}</Row>

          <Label>Your words (edit if you like)</Label>
          <TextInput
            value={text} onChangeText={setText} multiline textAlignVertical="top" maxLength={600}
            accessibilityLabel="Caption"
            style={{ minHeight: 130, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, padding: 14, fontFamily: fonts.sans, fontSize: 15, color: colors.ink }}
          />
          {note ? <Notice tone="leaf">{note}</Notice> : null}
          <Button title="Share picture + copy caption" icon="image-outline" kind="sun" busy={busy} onPress={picture} />
          <Button title="Share words only" kind="ghost" onPress={words} />
          <Small>Money goes to the kit, never to you. Your link is in the caption.</Small>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
