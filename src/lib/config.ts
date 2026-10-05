/** Public config only. Never put secrets in the app. */
export const API_BASE = (process.env.EXPO_PUBLIC_API_BASE || "https://solar.nexprove.com/api/v1").replace(/\/$/, "");
/** The website the API lives on, e.g. https://solar.nexprove.com. Paystack returns the buyer here. */
export const SITE = API_BASE.replace(/\/api\/v1$/, "");
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "30374421318-qf53knqbj1q4kddvu1upp5fokub2hnpr.apps.googleusercontent.com";
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "30374421318-ah8q1p242acavt5kdf7jg4v1fg6cjdhn.apps.googleusercontent.com";
export const WHATSAPP = "2347030546907";
export const waLink = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
/** Sign in with Apple needs a paid Apple Developer account first. Flip to true once it's set up. */
export const APPLE_READY = false;
