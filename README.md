# MyPM website

The MyPM marketing site: Home, Features, How it works, Pricing, About, FAQ, Early access, Privacy, Terms and 404.

This repo holds the finished, ready-to-serve site. Every file sits in the top level, so there is no build step.

## Deploy
Import this repo into Vercel or Netlify and press Deploy. Leave all build settings empty.

## Settings: edit `config.js`
- `supabaseUrl`, `supabaseKey`: from Supabase, Project Settings, API. Leave empty for preview mode, where submissions are not saved.
- `sheetEndpoint`: optional Google Sheet that also receives every signup.
- `contactEmail`: shown in the footer, contact and FAQ.
- `plausibleDomain` or `googleAnalyticsId`: optional analytics.
- `turnstileSiteKey`, `submitFunctionUrl`: optional spam protection. Both are needed.
- `appStoreUrl`, `playStoreUrl`: add when the app is published.

Save the file and the live site updates on the next deploy.

## Waitlist database (one time)
In Supabase, open SQL Editor, paste the waitlist SQL and run it. It creates a `waitlist` table that only accepts new signups. View signups in Supabase under Table Editor, waitlist.
