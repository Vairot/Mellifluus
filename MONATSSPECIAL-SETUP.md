# Monatsspecial — Setup (Sanity CMS)

Gets the Monatsspecial section on mellifluus.com editable by non-technical staff.
**→ YOU** = you run it. **→ Claude** = happens in the chat.

- **Sanity project:** `Cafe Mellifluus` — Project ID `nzfdq0wm`, dataset `production` (public)
- **Repo branch:** `monatsspecial-carousel` (merges last, once the real poster is in Sanity)

## Progress

- [x] **A. Studio created** — `studio/` scaffolded with `npm create sanity`
- [x] **B. Form added + tested** — `monatsspecial` schema; one entry published
- [x] **D. Website connected** — `build.js` pulls posters from Sanity, downloads
      them into the site, writes `data/monatsspecial.json` (both gitignored)
- [ ] **C. Deploy the Studio + invite staff** ← you are here
- [ ] **E. Auto-rebuild on Publish** (Vercel deploy hook + Sanity webhook)
- [ ] **F. Go live** (real poster in Sanity → merge branch)

---

## C. Deploy the Studio so staff can use it

**→ YOU**:

```bash
cd /Users/viktorglavatskzi/Desktop/Work/Mellifluus/studio && npm run deploy
```

- when asked for a **studio hostname**, enter `mellifluus` (if taken, try
  `cafe-mellifluus`) → editor is then permanently at
  **https://<hostname>.sanity.studio**

**Invite staff** — [sanity.io/manage](https://www.sanity.io/manage) → project
**Cafe Mellifluus** → **Members** → **Invite members** → their email → role
**Editor** (not Administrator). They get an email, set up a login, then just use
the studio URL.

> Free plan = limited editor seats (last known: 3). Check under *Plan*.

---

## E. Auto-rebuild when staff hit Publish

**→ YOU** — two parts:

### 1. Vercel deploy hook
[vercel.com](https://vercel.com) → project **mellifluus** → **Settings → Git → Deploy Hooks**
- Name: `Sanity Monatsspecial`  ·  Branch: `main`
- **Create** → copy the URL (`https://api.vercel.com/v1/integrations/deploy/prj_…/…`)

### 2. Sanity webhook
[sanity.io/manage](https://www.sanity.io/manage) → project **Cafe Mellifluus** →
**API → Webhooks → Create webhook**
- Name: `Rebuild website`
- URL: *(the Vercel deploy hook URL)*
- Dataset: `production`  ·  Trigger on: **Create**, **Update**, **Delete**
- Filter: `_type == "monatsspecial"`  ·  HTTP method: `POST`
- Save

Then: staff Publish → site rebuilds → live in ~1–2 min.

---

## F. Go live

**→ YOU** — in the Studio: make sure the real **Blackberry Tonic Matcha** poster
is uploaded and Published (a clean export looks better than a photo of the
printed flyer). Delete test entries.

**→ Claude** — opens + merges the PR for `monatsspecial-carousel` once you confirm.

**→ YOU** — check **mellifluus.com**: the section shows the real poster under the hero.

---

## Everyday use (for staff)

1. **<hostname>.sanity.studio** → log in
2. **Monatsspecial** → **+** (new) or click an existing entry
3. Upload the poster (portrait ~1200×1600, same image as Instagram), write the
   description, optionally set **Anzeigen ab / bis**
4. **Publish** → live in 1–2 minutes
5. Remove an old special: delete it, or let **Anzeigen bis** pass

3+ active posters → auto-scrolling carousel. 1–2 → side by side. 0 → section hidden.
