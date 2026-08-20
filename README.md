# Mellifluus – Website

Static one-page business-card website for Mellifluus (Specialty Coffee, 100% Halal — Kampstraße 7, 32423 Minden).

## Folder structure

```
Mellifluus/
├── index.html              Main page (hero, menu, map, hours, reservation form)
├── danke.html               Thank-you page shown after a reservation is submitted
├── css/
│   └── style.css            All site styling
├── js/
│   └── script.js            Mobile nav, menu tabs, form date validation
├── assets/
│   ├── images/
│   │   └── logo/             mellifluus-logo.jpg
│   └── video/
│       └── hero-background.mp4   Full-bleed hero background loop
└── materiarls/                Original raw files as provided — kept for reference only,
                                not used by the live site. Safe to delete once you've
                                confirmed everything needed was copied into assets/.
```

The menu (`#speisekarte` in `index.html`) is hand-coded HTML/CSS styled to match the
original photographed menu cards (cream card, thin gold/green corner accents,
underlined item names, right-aligned prices) — it's no longer built from the
`assets/images/menu/*.jpg` photos, so prices/items can be edited directly in the
markup with no risk of stale or blurry scans. Those source photos still live under
`materiarls/images/Menu/` for reference if you ever need to re-check an item.

## Running locally

### Setup

First, install dependencies:

```bash
npm install
```

### Development

```bash
npm run dev
```

This bundles `js/script-source.js` (with Speed Insights) into `js/script.js` via
`npm run build`, then serves the folder on `http://localhost:3000`.

To just rebuild the bundle without serving (e.g. before committing), run
`npm run build` on its own.

**Note:** If you modify `js/script-source.js`, run `npm run build` again to rebuild the bundle.

## Reservation form

The form on the Reservierung section posts to [FormSubmit](https://formsubmit.co) which forwards
submissions straight to **kompvsk8@gmail.com** — no backend/server needed.

**One-time activation:** the very first time the form is submitted, FormSubmit sends a
confirmation email to that inbox — you must click the confirmation link there before
further submissions get delivered. Test it once after deploying.

Notes:
- The form is a plain HTML POST (not AJAX) and FormSubmit's reCAPTCHA is left
  enabled — both are required for `_autoresponse` (below) to actually fire;
  FormSubmit silently skips the autoresponse on AJAX submissions and on forms
  with `_captcha=false`. A hidden honeypot field (`_honey`) still helps catch
  basic spam bots.
- Successful submissions redirect to `danke.html`. `_next` is set to a relative
  path in the markup, but `js/script.js` rewrites it to an absolute URL on page
  load, since the redirect is issued by formsubmit.co (a different origin) and
  a relative path there wouldn't resolve back to this site.
- `_autoresponse` sends a German thank-you message straight to the guest's own
  address (whatever they typed in the `E-Mail` field) right after they submit —
  no backend involved, FormSubmit handles it. Edit its `value` in `index.html` to
  change the wording. It contains `{DATUM}` and `{UHRZEIT}` placeholders that
  `js/script.js` fills in from the reservation's date/time fields right before
  submit — keep both placeholders if you edit the message. Note: on FormSubmit's
  free plan the autoresponse email's subject line is fixed and not customizable.
- If you ever want to switch the recipient address, just change the email in the
  form's `action` attribute in `index.html`.

## Analytics

### Web Analytics

Both `index.html` and `danke.html` include Vercel's vanilla-JS Web Analytics snippet
(no npm install — there's no build step here, so the `@vercel/analytics` package/its
`/next` import don't apply). It's inert on any other host; it only reports data once
the site is deployed on Vercel with **Web Analytics** enabled for the project in the
Vercel dashboard.

### Speed Insights

The site includes Vercel Speed Insights via the `@vercel/speed-insights` package, which
is bundled into `js/script.js` during the build process. This tracks real-user performance
metrics (Core Web Vitals) and requires:

1. **Enabling Speed Insights** in your Vercel project dashboard (under the Speed Insights section)
2. **Deploying to Vercel** — the tracking script will be available at `/_vercel/speed-insights/*` after deployment

Speed Insights will only collect data when deployed on Vercel with the feature enabled. It remains
inactive during local development and on other hosting platforms.

## Things to double check before going live

- **Video codec**: the original phone export (`materiarls/Background.MP4`) is HEVC
  (H.265), which is why the hero video wouldn't autoplay in Safari and would freeze
  after the first loop in Chromium-based browsers — support for HEVC in `<video>` is
  inconsistent across browsers/hardware. `assets/video/hero-background.mp4` has been
  re-encoded to H.264 (`ffmpeg -c:v libx264 -profile:v high -pix_fmt yuv420p -movflags
  +faststart`, audio stripped since the tag is muted anyway), which autoplays and
  loops reliably everywhere. This also dropped the file from ~38 MB to ~2.2 MB. If you
  ever replace this clip with a new export, re-encode it to H.264 the same way rather
  than dropping in a raw phone recording.
- **Video resolution**: the source clip is 1080×608, and the hero stretches it
  full-bleed across the whole viewport (`object-fit: cover` on `.hero-video`), so on
  very large screens it can look softly upscaled — that's inherent to the source
  footage, not a bug. A higher-resolution export would sharpen it further.
- **Map**: the embedded Google Map points at "Kampstraße 7, 32423 Minden" via a plain
  search query (no API key required). Verify the pin lands on the right building.
- **Menu content**: prices/items are typed out in `index.html` (matched against the
  original menu photos). If the café changes prices or items, edit the relevant
  `<li class="menu-item">` block directly — search for the item name.
