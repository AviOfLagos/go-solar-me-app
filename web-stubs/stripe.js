// Web preview only: the Stripe card sheet exists in the phone app, not in the browser.
const msg = { error: { code: "Failed", message: "Card payments open in the phone app. This is the web preview." } };
export const initStripe = async () => {};
export const initPaymentSheet = async () => msg;
export const presentPaymentSheet = async () => msg;
export const StripeProvider = ({ children }) => children;
