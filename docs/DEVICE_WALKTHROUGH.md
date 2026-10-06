# Device walkthrough (10 min, Android preview build)

Build: `eas build --profile preview --platform android`, install, then tick:

- [ ] Sign up with email: form moves above keyboard on every field; eye toggles the password; verify email arrives (check spam), link opens /verify
- [ ] Log out, log in with wrong password: clear error, no crash
- [ ] Google sign-in: either native sheet works, or browser opens, you sign in, app returns signed in
- [ ] Airplane mode on Home, Shop, Go Solar Me: error state with Retry, no blank screen. Retry works after turning it back on
- [ ] Start a Go Solar Me page, share sheet: keyboard doesn't cover the fields; share card shows new style and ₦ correctly
- [ ] Checkout: Paystack opens, back button returns to app
- [ ] Kill and reopen the app: still signed in

Anything failing: screenshot + which line, send me.
