# Supabase Redirector & App Deep Link

This document explains how to configure Supabase and the app so magic links reliably open the mobile app.

## Recommended URLs

- App custom scheme (app handles this): `sovrnmobile://auth`
- HTTPS redirector (recommended for email clients and browsers): `https://getsovrn.com/supabase-redirect`

## Steps

1. Deploy `web/supabase-redirect.html` to your site at `/supabase-redirect` (example: `https://getsovrn.com/supabase-redirect`).
2. In Supabase dashboard → Authentication → Settings → **Redirect URLs**, add:
   - `https://getsovrn.com/supabase-redirect`
   - `sovrnmobile://auth` (optional, but harmless)
   - (Optional for development) your Expo dev URL (e.g. `exp://...`) if you want to test locally — add the exact value sample that appears when running Expo.
3. In the app, we now send the HTTPS redirector as the `emailRedirectTo` so Supabase will redirect to it after verification; the redirector will forward the token fragment to the app scheme.

## Local dev notes

- The code falls back to `Linking.createURL('auth')` in `__DEV__` to make iterative testing easier. If you want to use the web redirector in dev as well, add your dev URL to Supabase Redirect URLs.

## Troubleshooting

- If the app logs show "URL did not contain supabase tokens", copy the URL from the device logs and paste it here; some email clients rewrite links and may strip fragments.
- If the redirector shows the manual link but tapping it doesn't open the app, confirm the custom scheme matches the one configured in `app.config.js` (`scheme: 'sovrnmobile'`) and the native app has intent filters / associated domains set.

If you'd like, I can:
- Deploy the HTML to your site (if you provide access), or
- Add a CI-friendly deploy snippet or a tiny Netlify/Cloudflare Pages config to publish the file quickly.
