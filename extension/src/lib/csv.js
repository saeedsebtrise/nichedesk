/**
 * eRank CSV import — the path that needs no eRank automation at all.
 *
 * Same rules as NicheDesk's importer (src/features/keywords/csv.ts): the header
 * row may sit under a title line, and columns are matched by name because
 * eRank's column set changes with the plan.
 */

/** Minimal RFC 4180 reader: quoted fields, escaped quotes, CRLF or LF rows. */
export function parseCsv(text) {
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ",") endField();
    else if (char === "\n") endRow();
    else if (char !== "\r") field += char;
  }

  if (field !== "" || row.length > 0) endRow();
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** "10,971,543" / "1.2K" / "136%" / "" -> a finite number (0 when unreadable). */
export function parseNumber(raw) {
  const cleaned = String(raw ?? "").replace(/[,\s"]/g, "").trim();
  if (cleaned === "" || cleaned === "-" || cleaned === "—") return 0;

  const suffix = cleaned.slice(-1).toUpperCase();
  const multiplier = suffix === "K" ? 1_000 : suffix === "M" ? 1_000_000 : 1;
  const value = Number.parseFloat(multiplier === 1 ? cleaned : cleaned.slice(0, -1));

  return Number.isFinite(value) ? Math.round(value * multiplier * 100) / 100 : 0;
}

export const HEADERS = {
  keyword: /^(keywords?|keyword ideas?|search terms?|tags?|phrase)$/i,
  searches: /(avg\.?\s*searches|average\s*searches|search\s*volume|^volume$|^searches$)/i,
  competition: /competition/i,
  clicks: /avg\.?\s*clicks|^clicks$/i,
  ctr: /ctr/i,
};

/** Index of each known column in a header row, -1 when absent. */
export function mapHeaders(cells) {
  const clean = cells.map((cell) => String(cell).replace(/\s+/g, " ").trim());
  const find = (pattern) => clean.findIndex((cell) => pattern.test(cell));
  return {
    keyword: find(HEADERS.keyword),
    searches: find(HEADERS.searches),
    competition: find(HEADERS.competition),
    clicks: find(HEADERS.clicks),
    ctr: find(HEADERS.ctr),
  };
}

/** Converts raw cell strings to a keyword row using a column map. */
export function toKeywordRow(cells, columns) {
  const cell = (index) => (index === -1 ? "" : (cells[index] ?? ""));
  return {
    keyword: String(cell(columns.keyword)).replace(/\s+/g, " ").trim(),
    searches: parseNumber(cell(columns.searches)),
    competition: parseNumber(cell(columns.competition)),
    clicks: columns.clicks === -1 ? null : parseNumber(cell(columns.clicks)),
    ctr: columns.ctr === -1 ? null : parseNumber(cell(columns.ctr)),
  };
}

export function parseErankCsv(text) {
  const rows = parseCsv(text);
  const headerIndex = rows.slice(0, 10).findIndex((cells) => mapHeaders(cells).keyword !== -1);

  if (headerIndex === -1) {
    return { rows: [], error: "No “Keywords” column found. Use eRank’s Keyword Tool → Export → CSV." };
  }

  const columns = mapHeaders(rows[headerIndex]);
  if (columns.searches === -1 && columns.competition === -1) {
    return { rows: [], error: "The CSV has no searches or competition column." };
  }

  return {
    rows: rows
      .slice(headerIndex + 1)
      .map((cells) => toKeywordRow(cells, columns))
      .filter((row) => row.keyword !== ""),
    error: null,
  };
}
