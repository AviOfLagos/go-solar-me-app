// Web preview only: the phone app keeps the sign-in token in the device keychain.
const ls = () => (typeof localStorage === "undefined" ? null : localStorage);
export const getItemAsync = async (k) => ls()?.getItem(k) ?? null;
export const setItemAsync = async (k, v) => { ls()?.setItem(k, v); };
export const deleteItemAsync = async (k) => { ls()?.removeItem(k); };
