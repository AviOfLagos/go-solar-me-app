import { useCallback } from "react";
import { router } from "expo-router";
import { initStripe, initPaymentSheet, presentPaymentSheet } from "@stripe/stripe-react-native";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "./api";
import { colors } from "@/theme";
import type { PayOptions, PayStart } from "./types";

export function usePayOptions() {
  return useQuery({ queryKey: ["payOptions"], queryFn: () => api<PayOptions>("/payments", { auth: false }), staleTime: 10 * 60_000 });
}

let stripeKey: string | null = null;
async function ensureStripe(key: string) {
  if (stripeKey === key) return;
  await initStripe({ publishableKey: key, urlScheme: "gosolarme" });
  stripeKey = key;
}

/** Releases an unpaid order's gift card hold at once (otherwise it lapses on its own). */
export const cancelPayment = (id: string, clientSecret = "") =>
  api(`/payments/${encodeURIComponent(id)}/cancel`, { body: { clientSecret } }).catch(() => {});

/**
 * Takes what a start call returned (/checkout, /pools/{id}/contribute, /gift-cards, /cards/setup)
 * and finishes the payment:
 * - gift card covered everything → the success screen
 * - Paystack page → the in-app page (/pay), which returns to the success screen
 * - Paystack saved card already charged → the success screen
 * - Stripe → the PaymentSheet, then the success screen
 * The success screen always asks the server (POST /payments/{id}); nothing is assumed here.
 */
export function usePay() {
  const opts = usePayOptions();
  return useCallback(
    async (start: PayStart, merchantLabel = "Solar Builders NG") => {
      if (start.paid && start.ref) {
        router.replace({ pathname: "/success", params: { order: start.ref } });
        return;
      }
      if (start.provider === "stripe" && start.clientSecret && start.id) {
        const key = opts.data?.stripePublishableKey;
        if (!key) throw new ApiError("Card payments from abroad aren't available right now.", 503);
        await ensureStripe(key);
        const init = await initPaymentSheet({
          paymentIntentClientSecret: start.clientSecret,
          merchantDisplayName: merchantLabel,
          returnURL: "gosolarme://stripe-redirect",
          appearance: { colors: { primary: colors.ink } },
        });
        if (init.error) {
          await cancelPayment(start.id, start.clientSecret);
          throw new ApiError(init.error.message || "The card form couldn't open. Try again.", 0);
        }
        const done = await presentPaymentSheet();
        if (done.error) {
          // Closing the sheet is not an error worth shouting about; a decline is.
          await cancelPayment(start.id, start.clientSecret);
          if (done.error.code === "Canceled") throw new ApiError("Payment cancelled. Nothing was charged.", 0, {}, "canceled");
          throw new ApiError(done.error.message || "Your card was declined. Try another card.", 402);
        }
        router.replace({ pathname: "/success", params: { id: start.id, secret: start.clientSecret } });
        return;
      }
      if (start.id && start.authorizationUrl) {
        router.push({ pathname: "/pay", params: { url: start.authorizationUrl, id: start.id } });
        return;
      }
      if (start.id) {
        router.replace({ pathname: "/success", params: { id: start.id } });
        return;
      }
      throw new ApiError("The payment couldn't start. Try again.", 0);
    },
    [opts.data?.stripePublishableKey],
  );
}
