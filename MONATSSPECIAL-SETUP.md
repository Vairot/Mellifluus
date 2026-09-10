# Monatsspecial — Setup (Sanity CMS)

Everything needed to get the Monatsspecial section on the website editable by
non-technical staff. Steps marked **→ YOU** are yours to run; **→ Claude** means
paste the result back in the chat and Claude does the next part.

- **Sanity project:** `Mellifluus` — Project ID `nzfdq0wm`, dataset `production` (public)
- **Repo branch:** `monatsspecial-carousel` (not merged yet — merges last, once a real poster is in)

---

## A. Create the Studio (the editor app)

**→ YOU** — in a terminal:

```bash
rm -rf /Users/viktorglavatskzi/Desktop/Work/Mellifluus/studio
```

```bash
cd /Users/viktorglavatskzi/Desktop/Work/Mellifluus && npm create sanity@latest -- --project nzfdq0wm --dataset production --template clean --output-path studio --package-manager npm --no-typescript
```

Prompts:
- **Login** → opens a browser; use the account that owns project `nzfdq0wm`
- **"Add a sample dataset / schema?"** → **No**
- **"Install dependencies?"** → **Yes** (big download, ~1–2 min)

Then check it starts:

```bash
cd /Users/viktorglavatskzi/Desktop/Work/Mellifluus/studio && npm run dev
```

→ browser opens `http://localhost:3333`, log in. Sidebar is empty for now (no schema yet). Stop it with `Ctrl+C`.

**→ Claude** — paste back:
1. output of `ls studio` and `ls studio/schemaTypes`
2. contents of `studio/sanity.config.js`

Claude then gives you `studio/schemaTypes/monatsspecial.js` and the one line to
add to `schemaTypes/index.js`.

---

## B. Add the Monatsspecial form + test it

**→ YOU** — after Claude gives you the schema file:
1. save it, restart `npm run dev`
2. **Monatsspecial** now appears in the sidebar → click **+**
3. upload any image, fill **Bildbeschreibung**, click **Publish**
4. confirm the entry shows in the list → tell Claude "it works"

---

## C. Publish the Studio so staff can use it

**→ YOU**:

```bash
cd /Users/viktorglavatskzi/Desktop/Work/Mellifluus/studio && npm run deploy
```

- when asked for a **studio hostname**, enter: `mellifluus`
- editor is then permanently at **https://mellifluus.sanity.studio**

**Invite HR** — [sanity.io/manage](https://www.sanity.io/manage) → project **Mellifluus**
→ **Members** → **Invite members** → their email → role **Editor** (not Administrator).
They get an email, set up a login, then just use `mellifluus.sanity.studio`.

> Free plan = limited editor seats (last known: 3). Check under *Plan* in the dashboard.

---

## D. Connect the website to Sanity

**→ Claude** — updates `build.js` so that on every deploy it:
- fetches the published posters from Sanity
- downloads the images into the site itself (served from mellifluus.com, no third-party)
- writes `data/monatsspecial.json`

Nothing for you here except pulling the branch changes.

---

## E. Auto-rebuild when staff hit Publish

**→ YOU** — two parts:

### 1. Vercel deploy hook
[vercel.com](https://vercel.com) → project **mellifluus** → **Settings → Git → Deploy Hooks**
- Name: `Sanity Monatsspecial`
- Branch: `main`
- **Create** → copy the URL (looks like `https://api.vercel.com/v1/integrations/deploy/prj_…/…`)

### 2. Sanity webhook
[sanity.io/manage](https://www.sanity.io/manage) → project **Mellifluus** → **API → Webhooks → Create webhook**
- Name: `Rebuild website`
- URL: *(paste the Vercel deploy hook URL)*
- Dataset: `production`
- Trigger on: **Create**, **Update**, **Delete**
- Filter: `_type == "monatsspecial"`
- HTTP method: `POST`
- Save

Now: staff Publish in the Studio → site rebuilds → change is live in ~1–2 min.

---

## F. Go live

**→ YOU** — in the Studio, add the real current special (the *Blackberry Tonic
Matcha* poster) and Publish. Delete any test entries.

**→ Claude** — opens the PR for the `monatsspecial-carousel` branch and merges it
once you confirm the real poster is in Sanity.

**→ YOU** — check **mellifluus.com**: the Monatsspecial section shows the real
poster right under the hero.

---

## Everyday use (after setup — for the README / staff)

1. Go to **mellifluus.sanity.studio**, log in
2. **Monatsspecial** → **+** for a new one, or click an existing one to change it
3. Upload the poster (portrait, ~1200×1600, same image as Instagram), write the
   description, optionally set **Anzeigen ab / bis**
4. **Publish** — live on the website in 1–2 minutes
5. Remove an old special: delete it, or let its **Anzeigen bis** date pass

More than 2 active posters → the website shows them as an auto-scrolling carousel.
1–2 → shown side by side. 0 → the section disappears entirely.
