# React + TypeScript + Vite

## Install as an app

Apna Cart is a PWA. Run `npm run dev`, open the local URL in Chrome or Edge, then use the install icon in the address bar or the in-app **Install app** button. On Android, open the browser menu and choose **Add to Home screen**.

The service worker is registered in `src/main.tsx` and the install metadata is in `public/manifest.webmanifest`.

## Backend setup

The store includes an Express API for OTP login and persistent orders. Copy `.env.example` to `.env`, add Firebase Admin credentials, then create a Firestore database in the Firebase console. Orders are saved in the `orders` collection. SMTP sends customer OTPs to email and sends every new order to `OWNER_EMAIL`.

For mobile-number OTP, also add the Twilio values in `.env`. Without SMTP or Twilio, development mode prints the OTP in the API terminal; production mode refuses to send an unconfigured OTP.

Run both apps with:

```bash
npm install
npm run dev:all
```

If Firebase credentials are missing, development falls back to `server/data/orders.json`; production should always use Firebase.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
