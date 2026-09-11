/**
 * Reads the keyword table from an eRank Keyword Tool page.
 *
 * Injected with chrome.scripting.executeScript, which serialises the function
 * source — so it must stay fully self-contained: no imports, no closures over
 * module state.
 *
 * Only rows the signed-in user can actually see are returned. eRank's free
 * plan blurs most rows behind an upgrade prompt; those rows are skipped rather
 * than read out of the page, because reading them would sidestep eRank's
 * paywall.
 */
export function extractErankKeywords() {
  const HEADERS = {
    keyword: /^(keywords?|keyword ideas?|search terms?|tags?)$/i,
    searches: /(avg\.?\s*searches|average\s*searches|search\s*volume|^searches$)/i,
    competition: /competition/i,
    clicks: /avg\.?\s*clicks|^clicks$/i,
    ctr: /ctr/i,
  };

  const text = (el) => String(el?.innerText ?? el?.textContent ?? "").replace(/\s+/g, " ").trim();

  const LOCKED_CLASS = /(blur|locked|paywall|upgrade)/i;
  /** True when a row is blurred, faded out or marked as locked. */
  const obscured = (el, stopAt) => {
    for (let node = el; node && node !== stopAt; node = node.parentElement) {
      if (LOCKED_CLASS.test(String(node.className?.baseVal ?? node.className ?? ""))) return true;
      const style = window.getComputedStyle(node);
      if (String(style.filter).includes("blur")) return true;
      // parseFloat, not Number: an unset opacity is "" and Number("") is 0.
      const opacity = Number.parseFloat(style.opacity);
      if (Number.isFinite(opacity) && opacity < 0.35) return true;
    }
    return false;
  };

  const loggedOut =
    /\/(login|signin|sign-in|register)/i.test(location.pathname) ||
    Boolean(document.querySelector('input[type="password"]'));
  if (loggedOut) return { loggedOut: true, rows: [], hidden: 0 };

  const grids = [];

  // Plain selectors rather than table.rows / row.cells, and rows are claimed
  // only by their own table so a table nested inside a cell is not mixed in.
  const cellsOf = (row) => [...row.children].filter((cell) => cell.tagName === "TD" || cell.tagName === "TH");
  for (const table of document.querySelectorAll("table")) {
    const ownRows = [...table.querySelectorAll("tr")].filter((row) => row.closest("table") === table);
    const headerRow = ownRows.find((row) => row.closest("thead")) ?? ownRows[0];
    if (!headerRow) continue;
    grids.push({
      root: table,
      headers: cellsOf(headerRow).map(text),
      rows: ownRows.filter((row) => row !== headerRow && !row.closest("thead")),
      cells: cellsOf,
    });
  }

  for (const grid of document.querySelectorAll('[role="grid"], [role="table"], [role="treegrid"]')) {
    if (grid.tagName === "TABLE") continue;
    const headers = [...grid.querySelectorAll('[role="columnheader"]')].map(text);
    const rows = [...grid.querySelectorAll('[role="row"]')].filter(
      (row) => row.querySelector('[role="cell"], [role="gridcell"]'),
    );
    grids.push({
      root: grid,
      headers,
      rows,
      cells: (row) => [...row.querySelectorAll('[role="cell"], [role="gridcell"]')],
    });
  }

  for (const grid of grids) {
    const find = (pattern) => grid.headers.findIndex((header) => pattern.test(header));
    const columns = {
      keyword: find(HEADERS.keyword),
      searches: find(HEADERS.searches),
      competition: find(HEADERS.competition),
      clicks: find(HEADERS.clicks),
      ctr: find(HEADERS.ctr),
    };
    if (columns.keyword === -1 || (columns.searches === -1 && columns.competition === -1)) continue;

    let hidden = 0;
    const rows = [];
    for (const row of grid.rows) {
      const cells = grid.cells(row);
      const cell = (index) => (index === -1 ? "" : text(cells[index]));
      const keyword = cell(columns.keyword);
      if (!keyword) continue;
      if (obscured(row, grid.root) || cells.some((c) => obscured(c, row))) {
        hidden += 1;
        continue;
      }
      rows.push({
        keyword,
        searches: cell(columns.searches),
        competition: cell(columns.competition),
        clicks: cell(columns.clicks),
        ctr: cell(columns.ctr),
      });
    }

    if (rows.length > 0 || hidden > 0) {
      return { loggedOut: false, rows, hidden, keywordParam: new URLSearchParams(location.search).get("keyword") };
    }
  }

  return { loggedOut: false, rows: [], hidden: 0, keywordParam: new URLSearchParams(location.search).get("keyword") };
}
