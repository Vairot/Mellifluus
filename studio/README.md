# Mellifluus Studio — Monatsspecial-Editor

Sanity Studio zum Pflegen der **Monatsspecials** auf mellifluus.com (die
Poster-Karten direkt unter dem Hero-Bereich).

Läuft **getrennt von der Website** und liegt öffentlich unter
**https://mellifluus.sanity.studio** — einloggen kann sich nur, wer eingeladen
wurde.

## Mitarbeiter:innen einladen

1. [sanity.io/manage](https://www.sanity.io/manage) → Projekt **Cafe Mellifluus**
2. Reiter **Members** → **Invite members**
3. E-Mail eingeben, Rolle **Editor** wählen (nicht *Administrator*)
4. Die Person bekommt eine E-Mail, legt ein Login an (oder „Sign in with Google")
   und ruft danach **mellifluus.sanity.studio** auf.

> Der kostenlose Plan enthält eine begrenzte Zahl an Editor-Plätzen
> (Stand zuletzt: 3) — aktuelle Zahl im Dashboard unter *Plan*.

## Ein Monatsspecial anlegen / ändern

1. Auf **mellifluus.sanity.studio** einloggen
2. Links **Monatsspecial** → **+** (neu) oder einen Eintrag anklicken
3. **Poster-Bild** hochladen (Hochformat ~1200 × 1600 px — am besten ein sauberer
   Export, dasselbe Bild wie auf Instagram)
4. **Bildbeschreibung** eintragen (Name, Zutaten, Preis — für Google/Screenreader)
5. Optional **Anzeigen ab / bis** setzen → danach verschwindet das Poster
   automatisch von der Website
6. **Publish** klicken

Nach dem Publish baut sich die Website automatisch neu (Webhook → Vercel), die
Änderung ist in 1–2 Minuten live. Altes Special entfernen: löschen oder
**„Anzeigen bis"** ablaufen lassen.

## Lokal starten (Entwickler)

```bash
cd studio
npm install
npm run dev        # http://localhost:3333
```

## Studio selbst veröffentlichen

Nur nötig, wenn sich die Eingabemaske (`schemaTypes/`) ändert:

```bash
cd studio
npm run deploy
```

Siehe auch `../MONATSSPECIAL-SETUP.md` im Hauptordner für das komplette Setup.
