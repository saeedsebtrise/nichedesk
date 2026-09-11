# NicheDesk

Sort eRank keyword exports into a **nested niche tree** and work through them.

Two tabs:

- **Sort Keyword** — upload an eRank CSV, filter the unsaved preview, bulk-add the rows into a niche.
- **Upcoming Work** — the saved keywords: filters, column toggles, competition colour rules, per-row trend/type/tick, bulk actions, CSV export.

## Run it

```bash
npm run dev
```

Then open the printed URL (http://localhost:3000 unless that port is taken).

| Route | What it is |
| --- | --- |
| `/` | Public landing page |
| `/app` | The tool itself (kept out of search results with `noindex` and `robots.txt`) |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | Generated SEO files |
| `/opengraph-image`, `/icon`, `/apple-icon` | Share card and icons, drawn at build time |

Before deploying, set the real domain so canonical URLs, the sitemap and the share image resolve:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## NicheDesk Research — the Chrome extension

`extension/` is a Manifest V3 extension that runs a four-step niche check: eRank keywords → Etsy snapshots → listing audit → GO / NO-GO report. The customer guide is [extension/README.md](extension/README.md).

```
extension/src/lib/analysis.js     every GO / NO-GO rule and score — pure, unit-tested
extension/src/lib/pipeline.js     the four steps, with all side effects injected
extension/src/lib/erank.js        reads the user's own eRank Keyword Tool page
extension/src/lib/erank-extract.js  the in-page table reader (skips plan-locked rows)
extension/src/lib/etsy.js         official Etsy Open API v3 client — paced, retries 429s
extension/src/lib/report-html.js  report rendering, shared by the page and the .html download
extension/src/background.js       service worker that owns a run
extension/src/popup/              the popup UI
extension/src/report/             the report page
```

Two sourcing decisions are deliberate. Listing and shop data come from the **official Etsy API**, not scraped etsy.com pages, so a run can't trip Etsy's bot protection or put a seller's account at risk. And eRank is read only through the **user's own login**, skipping rows their plan keeps locked; shared-account resellers are not supported.

```bash
npm run extension:icons   # redraw the icons
npm run extension:pack    # dist/nichedesk-research-<version>.zip for customers
npm run build && npm run extension:e2e   # real extension in Edge vs. stand-in eRank/Etsy
```

Before distributing, set `licenseServerUrl` (your deployed NicheDesk) and optionally `contactUrl` and a shared `defaultEtsyApiKey` in `extension/src/config.js`. A shared Etsy key needs Etsy's commercial-access approval.

### License keys

NicheDesk issues and checks the extension's keys. Keys look like `NDSK-7KQ2-M9XD-4HPA`, expire on a date, and are limited to a number of browsers (default 3).

Start the server with an admin token (16+ characters), then manage keys from the command line:

```bash
NICHEDESK_ADMIN_TOKEN=choose-a-long-secret npm run start
```

```bash
NICHEDESK_ADMIN_TOKEN=choose-a-long-secret npm run license -- create --days 30 --devices 3 --note "Ali Khan"
```

`list`, `revoke KEY` and `reset KEY` (frees the key's device seats) work the same way. Set `NICHEDESK_URL` to manage a deployed server.

| Route | Access |
| --- | --- |
| `POST /api/licenses/verify` | Public (CORS open) — `{ key, deviceId }` → valid / reason / expiry / seats |
| `GET, POST /api/licenses` | Admin token — list, create |
| `PATCH /api/licenses/:key` | Admin token — `{ action: "revoke" \| "reset-devices" }` |

License records live in the same data file as the workspace but are never returned by `/api/data` or rendered into the page. With no admin token set, the admin routes stay closed.

## The website

```
src/app/(marketing)/page.tsx          the landing page — composes the sections below
src/components/marketing/content.ts   ALL landing copy: features, steps, comparison, guide, FAQ
src/components/marketing/*.tsx        one component per section
src/components/marketing/MacbookFrame.tsx  the CSS MacBook around each screenshot
src/assets/screenshots/*.png          real screenshots of the tool
```

Edit copy in `content.ts` only. The FAQ there feeds both the page and its FAQPage structured data, so the two cannot drift apart. The copy makes no claim the tool cannot back: no user counts, ratings or testimonials.

The MacBook is drawn in CSS rather than a mockup image, so it stays sharp at any size, costs no extra download, and each screenshot inside it is a normal optimised `next/image` with real alt text.

### Refreshing the screenshots

The screenshots are real captures of the tool, taken against sample data so your own workspace is never touched. After changing the tool's UI:

```bash
npm run demo:seed                                     # writes data/demo.json + a sample eRank CSV
npm run build
NICHEDESK_DATA_FILE=data/demo.json npm run demo:serve  # production server on :3100
npm run demo:shots                                    # in a second terminal
npm run build                                         # again, so the share image uses the new shot
```

Capture runs against a production server because the dev server draws the Next.js indicator into every shot. It drives your installed Microsoft Edge through `playwright-core`, so there is no browser to download. The flows only open dialogs and filter an unsaved preview, so the demo data comes out unchanged.

### SEO

- **Title and description** are sized to what search results display in full (about 60 and 155 characters), with the primary phrase, "Etsy keyword research", first.
- **Structured data:** `WebSite`, `SoftwareApplication` (with a screenshot) and `FAQPage`. Ratings are deliberately absent — there are none to cite, and inventing them breaks Google's structured-data policy.
- **Page structure:** one `<h1>`, no skipped heading levels, descriptive alt text and explicit dimensions on every image (no layout shift), and a canonical URL.
- **Content:** a roughly 1,400-word page, including a long-form keyword research guide — the most topical text on the page.
- **Speed:** the page is prerendered as static HTML; fonts are self-hosted through `next/font`; the hero screenshot is preloaded as the LCP element and the rest lazy-load; scroll animations are pure CSS, so crawlers and reduced-motion users always see everything.

```bash
npm run verify   # lint + typecheck + tests + build
```

## Deploy to Vercel

1. Push this repository to GitHub.
2. On [vercel.com](https://vercel.com): **Add New → Project**, import the repository. Next.js is detected; keep the defaults.
3. In the project: **Storage → Create → Neon (Postgres)**, free plan, connect it to the project. This sets `DATABASE_URL`.
4. **Settings → Environment Variables** (see [.env.example](.env.example)):
   - `APP_PASSWORD` — locks the tool and its editing APIs. Always set this on a public deployment.
   - `NICHEDESK_ADMIN_TOKEN` — 16+ characters; enables license-key management.
   - `NEXT_PUBLIC_SITE_URL` — only once you add a custom domain.
5. **Deploy.** Every later `git push` redeploys automatically.

The data table is created on the first request. Nothing needs migrating. To manage license keys on the live site:

```bash
NICHEDESK_URL=https://your-app.vercel.app NICHEDESK_ADMIN_TOKEN=... npm run license -- list
```

Then set the extension's `licenseServerUrl` in `extension/src/config.js` to the live URL and run `npm run extension:pack`.

**Why a database:** Vercel's disk is read-only and wiped between requests, so the JSON file only works locally. With `DATABASE_URL` set, the same store logic runs on Postgres. Without it on Vercel, the app refuses to start rather than silently losing saves.

## The niche tree

Niches nest to any depth — a niche has a `parentId`, `null` at the top level.

- **Create** a subniche from the parent picker in *Add to a niche*, *Move to niche*, or the **+ New niche** manager.
- **Re-nest** an existing niche from the "nest under" dropdown in the manager. A niche can never be moved inside itself or its own descendants — those options are disabled, and the API rejects the move too.
- **Filter** by a parent and you get its keywords *plus* every keyword in its subniches. Pick a leaf and you get only that niche.
- **Labels** read as the full path: `png › christmas png › christmas tree png`.
- **Delete** offers two modes: *keep contents* lifts the children and keywords one level up, or *delete the subtree* removes the descendants and their keywords.

## Storage

Storage is deliberately behind one seam, because which database this ends up on is still open.

```
src/lib/store/types.ts      the Store interface — all the app ever sees
src/lib/store/document.ts   every business rule, written once against two JSON documents
src/lib/store/json-file.ts  local backend: data/nichedesk.json
src/lib/store/postgres.ts   hosted backend: two JSONB rows with versioned (optimistic) saves
src/lib/store/index.ts      Postgres when DATABASE_URL is set, otherwise the file
```

**Locally**, data lives in `data/nichedesk.json` (gitignored). Writes are serialised and land via a temp file plus rename, so a crash can't leave a half-written file. Override the path with `NICHEDESK_DATA_FILE`; delete the file to start from scratch.

**Deployed**, the workspace and the license list are two rows in a `nichedesk_documents` table. Each save only lands if nobody else saved since it read the row; otherwise it re-applies itself to a fresh copy. That works over Neon's stateless HTTP driver without long transactions, and the Postgres tests run the real SQL against PGlite.

**Password lock:** with `APP_PASSWORD` set, `/app` and the workspace APIs need a login (a signed, HttpOnly session cookie, 30 days) or `Authorization: Bearer <password>`, which is how the extension's "Send to NicheDesk" gets in. The landing page, `/login` and the license routes stay public. It's a single shared password, not per-user accounts.

## CSV import

The parser finds the header row within the first ten lines (eRank exports often carry a title line above it) and matches columns **by name**, not position, since eRank's column set varies by plan:

| Field | Matched headers |
| --- | --- |
| keyword | `Keywords`, `Search Term`, `Tag`, `Phrase` |
| volume | `Avg. Searches`, `Average Searches`, `Search Volume`, `Volume`, `Searches` |
| competition | anything containing `Competition` |

`"10,971,543"`, `1.2K` and `2M` all read as numbers. Duplicate keywords within a file are dropped, and rows already in the target niche are skipped on save — re-importing the same export is safe. With no recognisable header it falls back to columns 1/2/3 and says so.

## Layout

```
src/features/niches/tree.ts        the tree: build, flatten, descendants, path, cycle check
src/features/keywords/csv.ts       CSV reader and eRank column mapping
src/features/keywords/filters.ts   preview filters and Upcoming Work filters
src/features/settings/competition.ts  colour bands and cut-off normalising
src/features/workspace/useWorkspace.ts  client state; every mutation goes through the API
src/app/api/*                      route handlers, validated with zod
src/components/niches/*             tree select, tree list, picker dialog, manager dialog
```

Competition cut-offs are sorted ascending before use, so three boxes filled in out of order (green 5000, light green 10000, orange 2000) still produce contiguous bands instead of an unreachable one.
