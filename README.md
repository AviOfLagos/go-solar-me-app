# Go Solar Me

The iOS and Android app for Solar Builders NG. Expo SDK 57, expo-router, TanStack Query, Zustand.
The backend is the web app (`AviOfLagos/solar-builders-ng`); its `docs/MOBILE_APP.md` is the brief and `docs/API.md` the contract.

## Run it

```bash
npm ci
cp .env.example .env          # API base + public Google client IDs
npx expo prebuild             # native code (Stripe, Google, Apple, push need a dev build)
npx eas build --profile development --platform ios   # or android
npx expo start --dev-client
```

Expo Go can't run this app: it uses native modules (Stripe, Google sign-in, Apple sign-in).

## Checks (all pass)

```bash
npm run typecheck             # tsc --noEmit
npm run lint                  # expo lint
npx expo export -p android    # bundles
npx expo-doctor               # 21/21
```

## Config

| Value | Where |
|---|---|
| `EXPO_PUBLIC_API_BASE` | `.env` / `eas.json`. Default `https://solar.nexprove.com/api/v1` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | `.env`. Already set; Android sign-in uses it |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Set (default in `src/lib/config.ts`; `iosUrlScheme` in `app.json` matches) |
| Stripe publishable key | Comes from `GET /payments`; never in the app |
| `google-services.json` | Needed for Android push only (FCM via EAS) |

No secrets live in the app.

## Layout

```
src/app/            screens (expo-router)
  (tabs)/           Home (calculator) · Shop · Go Solar Me · Orders · Me
  kit.tsx           "How do you want to pay?" (6 ways)
  cart, checkout/   cart (+ ?resume=leadId) and checkout
  pay.tsx           Paystack in a WebView; catches the return URLs
  success.tsx       asks the server (POST /payments/{id}) and shows the result
  fund/             Go Solar Me pages: new, page + chip in + owner panel
  gift-cards, pay-small-small, sign-in, reset, account/*, s/[slug], b/[id]
src/lib/            api client, payments, sign-in, push, catalog, sharing
src/stores/         auth (token in SecureStore), cart (persisted, synced to /leads)
src/ui/             design-system components
src/shared/         format + store constants copied from the web repo
```

## Rules the code follows

- Money is whole naira; the app never sends prices, only `expectedTotal`.
- A payment is only "done" after `POST /payments/{id}` says so. Cancel/close calls `/cancel`.
- Guests can buy and chip in; sign-in is never forced for those.
- Server state lives in TanStack Query; Zustand holds only the cart and the token.

## Deep links

`gosolarme://` plus https links on `solar.nexprove.com` for `/fund/*`, `/b/*`, `/s/*`.
Universal links need `/.well-known/apple-app-site-association` and `assetlinks.json` on the web app once the Apple team ID and Android SHA-256 exist.

## Still to do (owner: Avi)

1. ~~Google iOS client~~ done (`30374421318-ah8q…`). Add it to `GOOGLE_CLIENT_IDS` in Vercel if not there.
2. First EAS Android build → `eas credentials` → SHA-1 → create the Google **Android** client → add to `GOOGLE_CLIENT_IDS`.
3. Apple Developer / Play accounts, store listings, live payment keys.
4. Device test with the Paystack and Stripe test cards.
