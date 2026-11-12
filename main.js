(function () {
  var cfg = window.MYPM_CONFIG || {};

  // Analytics: only loads when an ID is set in config.js
  function track(name, props) {
    try {
      if (window.plausible) window.plausible(name, { props: props });
      if (window.gtag) window.gtag("event", name === "Signup" ? "sign_up" : name, props);
    } catch (e) {}
  }
  function addScript(src, attrs) {
    var el = document.createElement("script");
    el.src = src; el.defer = true;
    for (var k in attrs || {}) el.setAttribute(k, attrs[k]);
    document.head.appendChild(el);
    return el;
  }
  if (cfg.plausibleDomain) {
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
    addScript("https://plausible.io/js/script.js", { "data-domain": cfg.plausibleDomain });
  }
  if (cfg.googleAnalyticsId) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", cfg.googleAnalyticsId, { anonymize_ip: true });
    addScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg.googleAnalyticsId));
  }
  // Count clicks on "Join the waitlist" style buttons, so you can see which page converts
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="early-access.html"]');
    if (a) track("CTA click", { label: a.textContent.trim(), page: location.pathname });
  });

  // Mobile menu
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) { menu.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); toggle.focus(); }
    });
  }

  // Show the contact email wherever the page has a [data-email] placeholder
  var email = (window.MYPM_CONFIG || {}).contactEmail;
  document.querySelectorAll("[data-email]").forEach(function (el) {
    if (!email) { el.hidden = true; return; }
    el.hidden = false;
    var a = el.querySelector("a") || el;
    a.href = "mailto:" + email;
    a.textContent = a.getAttribute("data-label") || email;
  });

  // Preselect the form intent from the URL, e.g. early-access.html?intent=command#join
  var params = new URLSearchParams(location.search);
  var intent = params.get("intent");
  if (intent) {
    var radio = document.querySelector('input[name="intent"][value="' + intent + '"]');
    if (radio) radio.checked = true;
  }

  // Waitlist / contact form
  var form = document.getElementById("signup-form");
  if (!form) return;
  var status = form.querySelector(".form-status");
  var loadedAt = Date.now();

  // Spam protection: Cloudflare Turnstile, only when the server-side check is set up too
  var useFunction = !!(cfg.submitFunctionUrl && cfg.turnstileSiteKey);
  if (useFunction) {
    var box = document.createElement("div");
    box.className = "cf-turnstile";
    box.setAttribute("data-sitekey", cfg.turnstileSiteKey);
    box.setAttribute("data-theme", "light");
    box.style.marginBottom = "16px";
    form.insertBefore(box, form.querySelector('button[type="submit"]'));
    addScript("https://challenges.cloudflare.com/turnstile/v0/api.js", { async: "" });
  }

  function show(msg, ok) {
    status.textContent = msg;
    status.className = "form-status show " + (ok ? "ok" : "err");
    status.focus();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    // Simple bot traps: a hidden field people never fill, and a too-fast submit
    if ((form.website && form.website.value) || Date.now() - loadedAt < 2500) {
      show("Thanks! You're on the list.", true); // look normal to bots, save nothing
      return;
    }

    var data = {};
    new FormData(form).forEach(function (v, k) { if (k !== "website") data[k] = v; });

    var btn = form.querySelector('button[type="submit"]');
    var thanks = {
      command: "Thanks! Our team will reach out to set up a Command conversation.",
      question: "Thanks for your message! We'll reply by email soon.",
      beta: "Thanks for applying! We'll be in touch about the beta program."
    }[data.intent] || "You're on the list! We'll email you when early access opens.";

    var payload = {
      intent: data.intent || "waitlist",
      name: (data.name || "").trim(),
      email: (data.email || "").trim(),
      role: data.role || null,
      company: (data.company || "").trim() || null,
      message: (data.message || "").trim() || null,
      consent: data.consent === "yes",
      page: location.pathname
    };

    var req = null;
    if (useFunction) {
      // Recommended: a Supabase Edge Function checks the Turnstile token, then saves
      // to the database (and the Google Sheet, if set on the server).
      var tokenEl = form.querySelector('[name="cf-turnstile-response"]');
      payload.turnstileToken = tokenEl ? tokenEl.value : "";
      if (!payload.turnstileToken) { show("Please complete the quick check above the button.", false); return; }
      req = fetch(cfg.submitFunctionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else if (cfg.supabaseUrl && cfg.supabaseKey) {
      req = fetch(cfg.supabaseUrl.replace(/\/$/, "") + "/rest/v1/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": cfg.supabaseKey,
          "Authorization": "Bearer " + cfg.supabaseKey,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(payload)
      });
    } else if (cfg.formEndpoint) {
      req = fetch(cfg.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    // Copy to the Google Sheet from the browser (only when not using the Edge Function,
    // which forwards to the Sheet itself). Apps Script has no CORS, so this is fire-and-forget.
    if (cfg.sheetEndpoint && !useFunction) {
      var sheetReq = fetch(cfg.sheetEndpoint, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
      req = req ? Promise.all([req, sheetReq.catch(function () {})]).then(function (r) { return r[0]; })
                : sheetReq.then(function () { return { ok: true, status: 200 }; });
    }

    if (!req) {
      show(thanks + " (Preview mode: this form isn't connected yet, so nothing was saved.)", true);
      form.reset();
      return;
    }

    btn.disabled = true;
    req.then(function (r) {
      // 409 = this email already signed up for this option; treat as success.
      if (!r.ok && r.status !== 409) throw new Error(r.status);
      show(thanks, true);
      track("Signup", { intent: payload.intent });
      form.reset();
      if (window.turnstile) window.turnstile.reset();
    }).catch(function () {
      show("Sorry, something went wrong. Please try again in a moment.", false);
    }).finally(function () { btn.disabled = false; });
  });
})();
