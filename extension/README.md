# NicheDesk Research — Chrome extension

Etsy niche research for eRank users. Type a seed keyword and the extension:

1. **Keywords** — reads eRank's Keyword Tool for that seed (or an eRank CSV you import) and keeps the keywords that pass your filters.
2. **Snapshots** — asks the official Etsy API for each keyword's top listings and who sells them.
3. **Listing audit** — picks out the listings that win their search while their shop is still small.
4. **Report** — a GO / NO-GO report you can download, export, or send into your NicheDesk workspace.

## Install

1. Unzip `nichedesk-research-<version>.zip`.
2. In Chrome or Edge open `chrome://extensions` (`edge://extensions` in Edge) and switch on **Developer mode**.
3. Click **Load unpacked** and choose the unzipped folder — the one that contains `manifest.json`.
4. Click the puzzle-piece icon in the toolbar and **pin** NicheDesk Research.

## First-time setup

Open the extension; Settings opens automatically the first time.

| Setting | What to put |
| --- | --- |
| **License key** | The `NDSK-XXXX-XXXX-XXXX` key you were sent. Press **Test** — you should see *Valid · expires … · device 1/3*. |
| **Etsy API key** | Free: sign in at [etsy.com/developers](https://www.etsy.com/developers), **Create a new app**, and paste its keystring (or `keystring:shared_secret`). Press **Test**. |
| **eRank** | Log in to eRank at [members.erank.com](https://members.erank.com) in this same browser. |

Press **Save settings**.

## Running a search

1. Type a **seed keyword** (for example `pet blanket`) and pick a **product type** if you only want digital or physical listings.
2. Press **Start full pipeline**. eRank opens in a background tab, is read, and closes by itself. You can keep browsing — just don't disable the extension while it runs.
3. When it finishes, the report opens in a new tab.

Each run uses **one eRank search** from your plan. Seeds you have already researched ask before running again.

### The step buttons

After a full run you can re-run any single step. The most useful is **Step 4: Report**: change a threshold in Settings (say, *Max shop reviews*), press Step 4, and the niche is re-judged instantly — no new eRank search, no new Etsy calls.

### Using your own eRank filters

Tick **Use my open eRank tab** to read a Keyword Tool tab you already have open, with whatever filters you set in eRank. Or use **Import an eRank CSV instead** — that path doesn't automate eRank at all.

## Settings explained

| Setting | Default | Meaning |
| --- | --- | --- |
| Min searches | 500 | Drop keywords with fewer average monthly searches. |
| Max competition | 25,000 | Drop keywords with more competing listings (eRank's figure). |
| Min words | 1 | Drop keywords shorter than this. |
| Max keywords | 20 | Check at most this many keywords on Etsy (highest searches first). |
| Require a seed word | off | Keep only keywords containing a word from your seed. |
| Top listings / keyword | 12 | How many of Etsy's top results to look at per keyword. |
| Max shop reviews | 300 | A top slot is **beatable** if the shop holding it has this many reviews or fewer. |
| Min beatable slots | 3 | A keyword **qualifies** if at least this many top slots are beatable. |
| Min qualified keywords | 5 | Needed after Step 1 to continue, and after Step 2 for a **GO**. |
| Listings to audit | 10 | How many winning listings Step 3 studies. |

## Reading the report

- **Keyword score (0–100)** — searches, share of beatable slots, competition and demand (favourites), combined.
- **Winner score (0–100)** — a listing that is getting favourites quickly, from a small shop, near the top. 50+ is a winner.
- **Beatable slot** — a top listing whose shop has no more than your *Max shop reviews*.
- Click any keyword row to see its top listings and the shops behind them.
- **Download .html** saves a self-contained copy; **Export CSV / JSON** for spreadsheets; **Send to NicheDesk** files the keywords into your niche tree.

## What it does and doesn't touch

- **eRank:** your own login only. Rows your plan keeps locked (blurred behind an upgrade prompt) are skipped, never read. Shared-account services are not supported. eRank's terms restrict automated use; the CSV import avoids automation entirely.
- **Etsy:** only the official Etsy Open API, with your API key. The extension never opens etsy.com pages or touches your Etsy account, so there is no need to log out of Etsy.
- **License server:** receives your key and a random device ID — nothing about your searches.
- Everything else — settings, reports, the activity log — stays in your browser.

## Troubleshooting

| Message | Fix |
| --- | --- |
| *You are not logged in to eRank* | Log in at members.erank.com in this browser, then run again. |
| *Etsy rejected the API key* | Re-copy the key from your Etsy app page; try `keystring:shared_secret`. |
| *Device limit reached* | The key is in use on its maximum number of browsers — ask for a seat reset. |
| *NO-GO — Not enough keywords* | Loosen Step 1 filters or lower *Min qualified keywords*, then press Step 4 (or try a broader seed). |

Copy the **activity log** (Copy button) when asking for help — it shows exactly where a run stopped.
