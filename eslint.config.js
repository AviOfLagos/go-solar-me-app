const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
module.exports = defineConfig([
  expoConfig,
  { ignores: ["dist/*", "node_modules/*"] },
  // Apostrophes inside <Text> are fine in React Native; this rule is for HTML.
  { rules: { "react/no-unescaped-entities": "off" } },
]);
