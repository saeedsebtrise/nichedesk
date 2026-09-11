import { nichePathLabel } from "../niches/tree";
import type { Niche } from "../niches/types";
import { toCsv } from "./csv";
import { opportunityScore } from "./opportunity";
import type { Keyword } from "./types";

/** Keywords as CSV, with the full niche path and opportunity score on every row. */
export function keywordsToCsv(keywords: Keyword[], niches: Niche[]): string {
  const header = ["Keyword", "Niche", "Volume", "Competition", "Score", "Trend", "Type", "Status", "Tick"];
  return toCsv([
    header,
    ...keywords.map((keyword) => [
      keyword.keyword,
      nichePathLabel(niches, keyword.nicheId),
      keyword.volume,
      keyword.competition,
      opportunityScore(keyword.volume, keyword.competition),
      keyword.trend,
      keyword.type,
      keyword.status,
      keyword.tick ? "yes" : "no",
    ]),
  ]);
}

/** Hands a CSV to the browser as a file download. */
export function downloadCsv(csv: string, fileName = `nichedesk-keywords-${new Date().toISOString().slice(0, 10)}.csv`) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
