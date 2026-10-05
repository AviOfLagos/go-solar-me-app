// Lets the app run in a browser for quick previews (`npx expo start --web`).
// Native-only modules are swapped for small stand-ins on web; phones use the real ones.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const stub = (f) => path.resolve(__dirname, "web-stubs", f);
const WEB_STUBS = {
  "@stripe/stripe-react-native": stub("stripe.js"),
  "@react-native-google-signin/google-signin": stub("google-signin.js"),
  "expo-apple-authentication": stub("apple-authentication.js"),
  "expo-secure-store": stub("secure-store.js"),
  "react-native-webview": stub("webview.js"),
};

const resolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && WEB_STUBS[moduleName]) return { type: "sourceFile", filePath: WEB_STUBS[moduleName] };
  return (resolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
