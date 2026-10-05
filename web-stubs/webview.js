// Web preview only: Paystack opens in a new browser tab instead of inside the app.
import { useEffect } from "react";
import { Text, View } from "react-native";
export function WebView({ source, onLoadEnd }) {
  useEffect(() => { if (source?.uri) window.open(source.uri, "_blank"); onLoadEnd?.(); }, [source?.uri]);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ textAlign: "center" }}>Paystack opened in a new tab. In the phone app it opens right here.</Text>
    </View>
  );
}
export default WebView;
