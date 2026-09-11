import type { IconName } from "./icons";

/**
 * Landing-page copy in one place.
 *
 * The FAQ list feeds both the rendered accordion and the FAQPage structured
 * data, so the two can never drift apart. Every claim here describes what the
 * tool actually does — there are no invented user counts, ratings or quotes.
 */

export type ShowcaseRow = {
  id: "import" | "niche-tree" | "work-queue";
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
};

export const SHOWCASE: ShowcaseRow[] = [
  {
    id: "import",
    eyebrow: "Import & filter",
    title: "Drop in the eRank CSV. Keep only what is worth making.",
    body: "The import preview holds the whole export without saving a thing. Narrow 120 rows to the 60 that contain “png”, knock out anything with “free”, set a volume floor and a competition ceiling — then select everything that survived in one click.",
    points: [
      "Finds the header row even under eRank’s title line",
      "Reads 10,971,543, 1.2K and 2M as real numbers",
      "Matches columns by name, whatever your plan exports",
      "Drops duplicate keywords in the file before you see them",
    ],
  },
  {
    id: "niche-tree",
    eyebrow: "Nested niche tree",
    title: "Parent to subniche, as deep as your shop goes.",
    body: "Research broad, sell narrow. File “christmas tree png” under “christmas png” under “png”, and every view understands the branch: filter the parent to see the whole family, or one subniche to see a single shelf.",
    points: [
      "Create a subniche right inside the Add to a niche dialog",
      "Rolled-up counts show what sits in every branch",
      "Re-nest any time — a niche can never be moved inside itself",
      "Delete a parent and choose: lift its contents, or remove the branch",
    ],
  },
  {
    id: "work-queue",
    eyebrow: "Upcoming Work",
    title: "A work queue, colour-coded against your own standard.",
    body: "Saved keywords become a desk you sit down at. Sort by volume, colour competition with the cut-offs you trust, set trend and hat type, tick what you are making this week, and mark rows done as listings go live.",
    points: [
      "Competition colours from three thresholds you set",
      "Evergreen, seasonal or trending — white, grey or black hat",
      "Pending, done and ticked-only filters",
      "Export the current view straight to CSV",
    ],
  },
];

export type Feature = {
  icon: IconName;
  title: string;
  body: string;
  /** Wide cards carry a product crop and span two columns. */
  image?: "colorRules" | "stats";
};

export const FEATURES: Feature[] = [
  {
    icon: "gauge",
    title: "Your competition thresholds",
    body: "Green, light green, orange and red — at the cut-offs you choose. Type them in any order; NicheDesk sorts them so no colour band ever goes missing.",
    image: "colorRules",
  },
  {
    icon: "layers",
    title: "Bulk actions for 1,000+ rows",
    body: "Select all matching, then mark done, move to a niche or delete in one go.",
  },
  {
    icon: "refresh",
    title: "Safe to re-import",
    body: "Saving skips keywords a niche already holds, so an updated export only adds what is new.",
  },
  {
    icon: "list",
    title: "Progress at a glance",
    body: "Total, pending, done, and the low-competition keywords still open — updated the moment you mark a row.",
    image: "stats",
  },
  {
    icon: "search",
    title: "Search and filter everything",
    body: "Keyword search plus niche, status, trend and type filters, a volume floor and a competition ceiling.",
  },
  {
    icon: "download",
    title: "Export whenever you like",
    body: "Your current view as CSV, with the full niche path on every row — ready for Excel, Sheets or Numbers.",
  },
  {
    icon: "lock",
    title: "No account, no tracking",
    body: "Open it and start working. There is no signup, and no analytics watching what you research.",
  },
];

export type Step = {
  title: string;
  body: string;
};

export const STEPS: Step[] = [
  {
    title: "Export from eRank",
    body: "Run a keyword search, then Export → Download as CSV. Any CSV with a keyword column works, so a hand-made list is fine too.",
  },
  {
    title: "Filter the preview",
    body: "Upload the file on Sort Keyword. Narrow the rows to the ones that matter, select all matching, and choose a niche — or create a subniche right there.",
  },
  {
    title: "Work through the desk",
    body: "Upcoming Work is your queue: sort by volume, read competition by colour, tick what you are making, and mark rows done as you publish.",
  },
];

export type ComparisonRow = {
  task: string;
  spreadsheet: string | boolean;
  nichedesk: string | boolean;
};

export const COMPARISON: ComparisonRow[] = [
  {
    task: "Keep part of an export without saving every row",
    spreadsheet: "Delete rows by hand",
    nichedesk: "Filter an unsaved preview",
  },
  {
    task: "Group keywords into niches and subniches",
    spreadsheet: "Tabs and colour fills",
    nichedesk: "A nested tree, any depth",
  },
  { task: "See a whole branch in one view", spreadsheet: false, nichedesk: true },
  {
    task: "Colour competition against your cut-offs",
    spreadsheet: "Conditional formatting, per sheet",
    nichedesk: "Three thresholds, one click",
  },
  {
    task: "Track pending, done and ticked",
    spreadsheet: "Extra columns you maintain",
    nichedesk: true,
  },
  { task: "Re-import without duplicating rows", spreadsheet: false, nichedesk: true },
  { task: "Export back to CSV", spreadsheet: true, nichedesk: true },
];

export type GuideSection = {
  heading: string;
  paragraphs: string[];
};

/** Long-form, genuinely useful copy — the part of the page search engines read closest. */
export const GUIDE: GuideSection[] = [
  {
    heading: "Why Etsy keyword research stalls after the export",
    paragraphs: [
      "Keyword tools are good at producing lists. One search in eRank can return well over a thousand related keywords, each with average searches, clicks and a competition figure. The trouble starts afterwards: the list mixes every angle of a topic together, christmas designs sit beside teacher designs, and competition runs from a few hundred listings to several million.",
      "Most sellers paste that export into a spreadsheet, colour a few rows, and lose the thread within a week. The research was fine. What was missing was structure — somewhere to decide what each keyword is for, and whether you have acted on it yet.",
    ],
  },
  {
    heading: "Research broad, sell narrow: organising keywords into niches",
    paragraphs: [
      "A niche is a shelf in your shop: “png”, “svg files”, “t-shirt designs”. A subniche is a narrower shelf inside it — “christmas png” inside “png”, and “christmas tree png” inside that. Long-tail keywords live at the bottom of that tree, which is exactly where a new listing has the best chance of being found.",
      "Nesting lets you work at both heights. Filter the parent when you want the big picture of a category, and a single subniche when you sit down to make listings for one theme. Because the tree is yours, it can mirror how your shop is actually laid out rather than how a tool decided to group things.",
    ],
  },
  {
    heading: "Reading competition numbers without guessing",
    paragraphs: [
      "eRank’s competition figure is, roughly, how many Etsy listings are competing for a search. A keyword with a few hundred competing listings is a very different opportunity from one with half a million, but a column of raw numbers makes that hard to see at a glance.",
      "Setting your own colour thresholds turns the column into a signal. Decide what low competition means for your shop — under 5,000 listings, say — and every keyword is coloured against that line. The number you care about most becomes the first thing you notice.",
    ],
  },
  {
    heading: "A simple weekly keyword workflow",
    paragraphs: [
      "Export a fresh search, filter the preview down to what fits your shop, and file it into the right niche. Tick the handful you will make this week. As each listing goes live, mark its keyword done. Next week, re-import the updated export: keywords you already hold are skipped, so only genuinely new ideas are added.",
      "The goal is not a bigger list. It is a shorter one you trust — and a clear view of what is left to do.",
    ],
  },
];

export type Faq = {
  question: string;
  answer: string;
};

export const FAQS: Faq[] = [
  {
    question: "What does NicheDesk actually do?",
    answer:
      "It takes the keyword CSV you export from eRank and turns it into an organised, nested plan. Instead of a 1,000-row spreadsheet, you get keywords filed into niches and subniches, colour-coded by your own competition thresholds, with a pending or done state on each one so you can see what is left to make.",
  },
  {
    question: "What is a subniche, and why nest them?",
    answer:
      "A subniche is a niche inside another niche — “christmas png” under “png”. Nesting matters because you research broad and sell narrow. Filtering by the parent shows the whole branch when you want the big picture; filtering by one subniche shows only that shelf when you sit down to make listings. You can nest as many levels deep as you like, and re-nest a niche later without losing its keywords.",
  },
  {
    question: "Do I need an eRank subscription?",
    answer:
      "You need some way to get a keyword CSV, and eRank is what NicheDesk is built around. The importer is not fussy though: it matches columns by name and falls back to reading the first three columns as keyword, volume and competition, so a CSV from another tool or one you typed yourself will import too.",
  },
  {
    question: "Is NicheDesk affiliated with Etsy or eRank?",
    answer:
      "No. It is an independent tool that reads CSV files you export yourself. It does not connect to your Etsy shop or your eRank account, and it never sends your keywords to either of them.",
  },
  {
    question: "Do I need an account?",
    answer: "No. There is no signup and no login — open the tool and start working.",
  },
  {
    question: "Where is my keyword data stored?",
    answer:
      "In a data file alongside the app rather than a third-party service, so nothing is sent anywhere else. You can delete the file at any time to start clean.",
  },
  {
    question: "Can I get my keywords back out?",
    answer:
      "Yes. Export CSV on the Upcoming Work tab writes out whatever your current filters show, with the full niche path, volume, competition, trend, type, status and tick on every row — so it opens straight into Excel, Google Sheets or Numbers.",
  },
  {
    question: "Will importing the same export twice duplicate everything?",
    answer:
      "No. On save, keywords the target niche already holds are skipped and counted, and duplicates inside a single file are dropped as it is read. Re-importing an updated export just adds what is new.",
  },
];
