import { Platform } from "react-native";
import { GoogleSignin, isErrorWithCode, statusCodes } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { api, ApiError } from "./api";
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID, SITE } from "./config";
import { useAuth, type SessionUser } from "@/stores/auth";
import { registerForPush } from "./push";

let configured = false;
function configureGoogle() {
  if (configured) return;
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID || undefined });
  configured = true;
}

type Auth = { user: SessionUser; token: string };

async function finish(r: Auth) {
  await useAuth.getState().signedIn(r.token, r.user);
  void registerForPush();
  return r.user;
}

/** A secret only this phone knows, so a link caught by another app is useless. */
function randomState() {
  const g = globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } };
  const bytes = new Uint8Array(24);
  if (g.crypto?.getRandomValues) g.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Google through the website: works in every build (no signing-key setup), because the browser
 * does the sign-in and hands back a one-time code. Returns null if the person closes the window.
 */
async function signInWithGoogleWeb() {
  const state = randomState();
  const res = await WebBrowser.openAuthSessionAsync(`${SITE}/app-sign-in?state=${state}`, "gosolarme://auth");
  if (res.type !== "success") return null;
  const code = Linking.parse(res.url).queryParams?.code;
  if (typeof code !== "string" || !code) throw new ApiError("Google sign-in didn't finish. Try again.", 0);
  return finish(await api<Auth>("/auth/app-exchange", { body: { code, state }, auth: false }));
}

/** Google sign-in. Uses the phone's own Google accounts when this build allows it, and the website otherwise. Returns null if the person cancels. */
export async function signInWithGoogle() {
  configureGoogle();
  try {
    if (Platform.OS === "android") await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    if (res.type !== "success") return null;
    const credential = res.data.idToken;
    if (!credential) return signInWithGoogleWeb();
    return finish(await api<Auth>("/auth/google", { body: { credential }, auth: false }));
  } catch (e) {
    if (isErrorWithCode(e) && (e.code === statusCodes.SIGN_IN_CANCELLED || e.code === statusCodes.IN_PROGRESS)) return null;
    if (e instanceof ApiError) throw e;
    const code = String((e as { code?: string | number })?.code ?? "");
    if (code === "WEB_PREVIEW") throw new ApiError("Google sign-in works in the phone app. Use email in this preview.", 0);
    // Any other problem (for example this build's signing key isn't known to Google, code 10): go through the website instead.
    try {
      return await signInWithGoogleWeb();
    } catch (e2) {
      if (e2 instanceof ApiError) throw e2;
      throw new ApiError("Google sign-in didn't go through. Try again, or use email.", 0);
    }
  }
}

export const appleAvailable = () => (Platform.OS === "ios" ? AppleAuthentication.isAvailableAsync() : Promise.resolve(false));

/** Sign in with Apple (iOS). Apple shares the name only the first time. */
export async function signInWithApple() {
  try {
    const c = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });
    if (!c.identityToken) throw new ApiError("Apple didn't return a sign-in token. Try again.", 0);
    const fullName = [c.fullName?.givenName, c.fullName?.familyName].filter(Boolean).join(" ");
    return finish(await api<Auth>("/auth/apple", { body: { identityToken: c.identityToken, fullName }, auth: false }));
  } catch (e) {
    if ((e as { code?: string })?.code === "ERR_REQUEST_CANCELED") return null;
    if (e instanceof ApiError) throw e;
    throw new ApiError("Apple sign-in didn't go through. Try again.", 0);
  }
}

export async function signInWithEmail(mode: "login" | "register", body: { name?: string; email: string; password: string; phone?: string }) {
  return finish(await api<Auth>(mode === "login" ? "/auth/login" : "/auth/register", { body, auth: false }));
}

export async function finishWithToken(r: Auth) {
  return finish(r);
}

export async function signOutGoogle() {
  configureGoogle();
  await GoogleSignin.signOut().catch(() => {});
}
