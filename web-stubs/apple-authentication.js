// Web preview only.
import { View } from "react-native";
export const isAvailableAsync = async () => false;
export const signInAsync = async () => { throw new Error("Apple sign-in works in the iPhone app."); };
export const AppleAuthenticationScope = { FULL_NAME: 0, EMAIL: 1 };
export const AppleAuthenticationButtonType = { SIGN_IN: 0, CONTINUE: 1 };
export const AppleAuthenticationButtonStyle = { WHITE: 0, WHITE_OUTLINE: 1, BLACK: 2 };
export const AppleAuthenticationButton = () => <View />;
