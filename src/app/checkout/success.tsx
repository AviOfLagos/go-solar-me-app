import { Redirect, useLocalSearchParams } from "expo-router";
import { asString } from "@/lib/kit";

/** A web-style return link (/checkout/success?reference=…) opened in the app goes to the result screen. */
export default function CheckoutSuccessLink() {
  const q = useLocalSearchParams<{ reference?: string; trxref?: string; payment_intent?: string; payment_intent_client_secret?: string; order?: string }>();
  const id = asString(q.reference) || asString(q.trxref) || asString(q.payment_intent);
  if (asString(q.order)) return <Redirect href={{ pathname: "/success", params: { order: asString(q.order) } }} />;
  return <Redirect href={{ pathname: "/success", params: { id, secret: asString(q.payment_intent_client_secret) } }} />;
}
