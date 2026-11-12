// Site settings. Edit these before going live.
window.MYPM_CONFIG = {
  // Supabase project that stores waitlist / contact form submissions.
  // Both values are public by design (the table only allows inserts). Find them in
  // Supabase → Project Settings → API. Leave empty to run the form in preview mode.
  supabaseUrl: "",
  supabaseKey: "",

  // Google Sheet in your Drive (see google-sheets/Code.gs). Works alongside Supabase:
  // when both are set, every submission goes to both.
  sheetEndpoint: "",

  // Public contact email shown on the site (footer, contact and FAQ). Leave empty to hide.
  contactEmail: "",

  // Optional alternative: any URL that accepts a JSON POST (e.g. Formspree).
  // Only used if the Supabase values above are empty.
  formEndpoint: "",

  // Spam protection (recommended once live). Needs BOTH values:
  // - turnstileSiteKey: from Cloudflare dashboard → Turnstile (free)
  // - submitFunctionUrl: your deployed Supabase Edge Function, see supabase/functions/waitlist-submit
  // When set, the form sends to the function instead of straight to the database.
  turnstileSiteKey: "",
  submitFunctionUrl: "",

  // Analytics (set one). Plausible is privacy-friendly and needs no cookie banner.
  plausibleDomain: "",     // e.g. "mypm.com"
  googleAnalyticsId: "",   // e.g. "G-XXXXXXXXXX"

  // App store links. Leave empty until the app is published.
  appStoreUrl: "",
  playStoreUrl: ""
};
