# Glint · Global Sales Clock

A pinned world-clock command center for selling across timezones. Built for fast
"is this a good time to reach out?" decisions — live local times, a day/night world
map, and color-coded business-hours intelligence for every prospect city.

Everything is **self-contained** — the world map and libraries are vendored into
`/vendor`, so it works offline and never breaks on a CDN outage. The only external
request is Google Fonts, which degrades gracefully to system fonts if blocked.

---

## What it does

- **Pinned markets** — your locked cities (Buenos Aires, US, Dubai, Singapore,
  Sydney, London) always show, in order, and survive reloads.
- **Live map** — equirectangular world map with a real-time **day/night terminator**.
  Pins are color-coded by status. Scroll to zoom, drag to pan. Hover a pin or card to
  link the two.
- **Business-hours intelligence** — each city is flagged:
  - 🟢 **Reach out now** — inside business hours
  - 🟡 **Edge of the day** — within an hour of open/close
  - ⚪ **Off-hours** — awake but outside business hours
  - 🔵 **Likely asleep** — 22:00–06:00 local
  - 🟣 **Weekend** — and it knows the **Gulf/Israel weekend is Fri–Sat**, not Sat–Sun.
- **Overlap planner** — every card has a 24-hour strip showing the city's working
  shape, a white "now" line, and a dashed band marking **your** working hours mapped
  onto their clock. Where green meets the dashed band = the call window.
- **DST-correct** — times come from the browser's IANA timezone engine, so daylight
  saving is always right (no offset tables to maintain).
- **Add any city** — press **A** or click *Add city* for a search palette over **500
  cities — every country, plus 2+ per US state** (search by city, country, or common
  alias — "usa", "uk", "holland" all work). Pin it to lock it, or leave it temporary.
- **Controls** — set your working hours, toggle 12/24h, sort by pinned / their time /
  best-to-call, and filter to "only reachable now."

State saves to your browser (`localStorage`), per device.

---

## Staying accurate over time (timezone rule changes)

You will **never** quote a wrong time because a country changed its rules — by design:

- The app **stores no offsets**. `cities.js` holds only IANA zone *names* (e.g.
  `Asia/Singapore`). Every time, offset, and DST decision is computed live from your
  device's built-in **IANA timezone database** — the same dataset the whole industry
  uses to track changes.
- When a country abolishes DST, shifts its offset, or moves its transition dates, IANA
  publishes an update and your **browser/OS picks it up automatically** with normal
  updates. Nothing in this project needs editing.
- **Visible proof, not blind trust:** each city shows its live zone name, which changes
  with the rules — London reads *"British Summer Time"* in summer and *"Greenwich Mean
  Time"* in winter (hover a map pin to see it). If that label is right, the time is right.
- **Self-check:** the **"Live TZ"** chip in the header verifies, on every load, that all
  zones resolve on your device *and* that DST is actually being applied. If your device's
  data is ever too old, the chip turns amber and tells you to update — your one and only
  maintenance action is **keep your computer/phone OS and browser up to date.**

Canonical zone names are used throughout (e.g. `Europe/Kyiv`, `Asia/Kolkata`), so even
zone *renames* keep working via IANA's backward-compatible aliases.

## Deploy to Cloudflare Pages

This is a static site — no build step. Two ways:

### A. Connect the GitHub repo — recommended (auto-deploys on every push)
This repo is `github.com/nicolaspazos/world-clock`.
1. **dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git**.
2. Pick the **`world-clock`** repository.
3. Build settings: **Framework preset = None**, **Build command = (leave empty)**,
   **Build output directory = `/`**.
4. **Save and Deploy** → you get `https://world-clock.pages.dev`. From then on, every
   `git push` to `main` redeploys automatically.

### B. Dashboard drag & drop — no Git
1. **dash.cloudflare.com → Workers & Pages → Create → Pages → Upload assets**.
2. Name it (e.g. `world-clock`).
3. Drag the **contents** of this folder (`index.html`, `assets/`, `vendor/`, `_headers`)
   into the uploader. *(Upload the files, not the parent folder.)*
4. Deploy → `https://world-clock.pages.dev`.

### C. Wrangler CLI — repeatable
```bash
npm install -g wrangler
wrangler login
# from inside the world-clock folder:
wrangler pages deploy . --project-name world-clock
```

### Custom domain
In the Pages project → **Custom domains** → add e.g. `clock.glintsites.com`
(Cloudflare adds the DNS record automatically if glintsites.com is on your account).

---

## Make it yours

- **Change the default pinned cities / notes** → edit `DEFAULT_STATE` at the bottom of
  [`assets/cities.js`](assets/cities.js). The `note` under each city is the little label
  (e.g. "Marine · Finance").
- **Add a city to the database** → add a row to `CITY_DB` in the same file with
  `id, city, country, cc, tz` (IANA), `lat, lng`.
- **Change your home city / working hours** → home is the `home` field in `DEFAULT_STATE`;
  hours are editable live in the UI (the gear-less "09–18" button).
- After editing defaults, click **Reset** in the app to reload them (or clear the site's
  localStorage).

---

## Files
```
index.html              # shell + fonts
assets/styles.css       # all styling (dark "mission control" theme)
assets/cities.js        # city database + your default pinned set
assets/app.js           # time math, map, business logic, persistence
vendor/                 # d3, topojson-client, world map data (offline)
_headers                # Cloudflare cache rules
```
