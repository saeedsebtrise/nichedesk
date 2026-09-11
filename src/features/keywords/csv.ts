import type { ImportRow } from "./types";

/** Minimal RFC 4180 reader: quoted fields, escaped quotes, CRLF or LF rows. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = 0;

  // A UTF-8 BOM would otherwise end up inside the first header name.
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < input.length) {
    const char = input[i];

    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      quoted = true;
      i += 1;
      continue;
    }
    if (char === ",") {
      endField();
      i += 1;
      continue;
    }
    if (char === "\r") {
      i += 1;
      continue;
    }
    if (char === "\n") {
      endRow();
      i += 1;
      continue;
    }

    field += char;
    i += 1;
  }

  if (field !== "" || row.length > 0) endRow();

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** "10,971,543" / "1.2K" / "48 212" / "" -> a finite number (0 when unreadable). */
export function parseNumber(raw: string): number {
  const cleaned = raw.replace(/[,\s"]/g, "").trim();
  if (cleaned === "" || cleaned === "-") return 0;

  const suffix = cleaned.slice(-1).toUpperCase();
  const multiplier = suffix === "K" ? 1_000 : suffix === "M" ? 1_000_000 : 1;
  const numeric = Number.parseFloat(multiplier === 1 ? cleaned : cleaned.slice(0, -1));

  return Number.isFinite(numeric) ? Math.round(numeric * multiplier) : 0;
}

const KEYWORD_HEADER = /^(keywords?|search\s*terms?|tags?|phrase)$/i;
const VOLUME_HEADER = /(avg\.?\s*searches|average\s*searches|search\s*volume|^volume$|^searches$)/i;
const COMPETITION_HEADER = /competition/i;

const normalize = (cell: string) => cell.replace(/\s+/g, " ").trim();

/**
 * Locates the header row and the three columns we care about.
 *
 * eRank exports sometimes carry a title or blank line above the real header, so
 * the first ten rows are scanned rather than assuming row 0. Columns are matched
 * by name instead of position because eRank's column set changes with the plan
 * and with which columns the user chose to show.
 */
function findHeader(rows: string[][]) {
  for (let index = 0; index < Math.min(rows.length, 10); index += 1) {
    const cells = rows[index].map(normalize);
    const keyword = cells.findIndex((cell) => KEYWORD_HEADER.test(cell));
    if (keyword === -1) continue;

    return {
      index,
      keyword,
      volume: cells.findIndex((cell) => VOLUME_HEADER.test(cell)),
      competition: cells.findIndex((cell) => COMPETITION_HEADER.test(cell)),
    };
  }

  return null;
}

export type ParseResult = {
  rows: ImportRow[];
  /** Non-fatal notes worth showing above the preview. */
  warnings: string[];
};

export function parseErankCsv(text: string): ParseResult {
  const rows = parseCsv(text);
  if (rows.length === 0) return { rows: [], warnings: ["That file is empty."] };

  const header = findHeader(rows);
  const warnings: string[] = [];

  // Without a recognisable header, fall back to positional columns — that is how
  // a "copy to clipboard" paste or a hand-made list usually arrives.
  const columns = header ?? { index: -1, keyword: 0, volume: 1, competition: 2 };
  if (!header) {
    warnings.push("No eRank header row found — read column 1 as keyword, 2 as volume, 3 as competition.");
  } else {
    if (columns.volume === -1) warnings.push("No search-volume column found — volume set to 0.");
    if (columns.competition === -1) warnings.push("No competition column found — competition set to 0.");
  }

  const seen = new Set<string>();
  const parsed: ImportRow[] = [];
  let duplicates = 0;

  for (let index = columns.index + 1; index < rows.length; index += 1) {
    const cells = rows[index];
    const keyword = normalize(cells[columns.keyword] ?? "");
    if (keyword === "") continue;

    const key = keyword.toLowerCase();
    if (seen.has(key)) {
      duplicates += 1;
      continue;
    }
    seen.add(key);

    parsed.push({
      id: `row-${index}`,
      keyword,
      volume: columns.volume === -1 ? 0 : parseNumber(cells[columns.volume] ?? ""),
      competition: columns.competition === -1 ? 0 : parseNumber(cells[columns.competition] ?? ""),
    });
  }

  if (duplicates > 0) {
    warnings.push(`Skipped ${duplicates} duplicate keyword${duplicates === 1 ? "" : "s"} in the file.`);
  }

  return { rows: parsed, warnings };
}

export function toCsv(rows: (string | number)[][]): string {
  const escape = (value: string | number) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return rows.map((row) => row.map(escape).join(",")).join("\r\n");
}
