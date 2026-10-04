import { Share } from "react-native";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import { API_BASE, SITE } from "./config";

/**
 * Shares one of the server-made milestone pictures with its link. Falls back to sharing the
 * link alone if the picture can't be downloaded.
 */
export async function sharePicture(kind: "pool" | "order", id: string, text: string, link: string, format: "story" | "square" = "story") {
  const url = `${API_BASE}/share/${kind}/${encodeURIComponent(id)}?f=${format}`;
  try {
    if (await Sharing.isAvailableAsync()) {
      const file = await File.downloadFileAsync(url, new File(Paths.cache, `${kind}-${id}-${format}-${Date.now()}.png`));
      await Sharing.shareAsync(file.uri, { mimeType: "image/png", dialogTitle: text, UTI: "public.png" });
      return;
    }
  } catch {
    // fall through to a plain link share
  }
  await Share.share({ message: `${text} ${link}` });
}

export const shareLink = (text: string, path: string) => Share.share({ message: `${text} ${SITE}${path}` });
