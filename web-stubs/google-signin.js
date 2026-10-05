// Web preview only: Google sign-in runs in the phone app.
export const statusCodes = { SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED", IN_PROGRESS: "IN_PROGRESS", PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE" };
export const isErrorWithCode = (e) => !!e && typeof e === "object" && "code" in e;
export const isSuccessResponse = (r) => r?.type === "success";
export const GoogleSignin = {
  configure() {},
  async hasPlayServices() { return true; },
  async signIn() { throw Object.assign(new Error("Google sign-in works in the phone app, not the web preview."), { code: "WEB_PREVIEW" }); },
  async signOut() {},
};
