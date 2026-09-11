// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";

import { extractErankKeywords } from "../src/lib/erank-extract.js";

const HEAD =
  "<tr><th></th><th>Keywords</th><th>Search Trend</th><th>Avg. Searches</th><th>Avg. Clicks</th>" +
  "<th>Avg. CTR</th><th>Etsy Competition</th><th>KD</th></tr>";
const cells = (keyword, searches, competition) =>
  `<td>☆</td><td>${keyword}</td><td>Jul 26</td><td>${searches}</td><td>1,213</td><td>80%</td><td>${competition}</td><td>74</td>`;

beforeEach(() => {
  history.replaceState({}, "", "/keyword-tool?keyword=pet%20blanket&country=GLO");
  document.body.innerHTML = "";
});

describe("extractErankKeywords", () => {
  it("reads visible table rows by column name", () => {
    document.body.innerHTML = `<table><thead>${HEAD}</thead><tbody>
      <tr>${cells("pet blanket", "1,512", "44,649")}</tr>
      <tr>${cells("dog blanket with name", "1,830", "6,400")}</tr>
    </tbody></table>`;

    const result = extractErankKeywords();

    expect(result.loggedOut).toBe(false);
    expect(result.keywordParam).toBe("pet blanket");
    expect(result.rows).toEqual([
      { keyword: "pet blanket", searches: "1,512", competition: "44,649", clicks: "1,213", ctr: "80%" },
      { keyword: "dog blanket with name", searches: "1,830", competition: "6,400", clicks: "1,213", ctr: "80%" },
    ]);
  });

  it("skips rows eRank's plan has locked, counting them instead", () => {
    document.body.innerHTML = `<table><thead>${HEAD}</thead><tbody>
      <tr>${cells("pet blanket", "1,512", "44,649")}</tr>
      <tr class="row-blurred">${cells("secret keyword", "9,999", "1")}</tr>
      <tr style="filter: blur(6px)">${cells("another secret", "8,888", "2")}</tr>
    </tbody></table>`;

    const result = extractErankKeywords();

    expect(result.rows.map((r) => r.keyword)).toEqual(["pet blanket"]);
    expect(result.hidden).toBe(2);
  });

  it("reads ARIA grids as well as tables", () => {
    document.body.innerHTML = `<div role="grid">
      <div role="row"><div role="columnheader">Keywords</div><div role="columnheader">Avg. Searches</div><div role="columnheader">Competition</div></div>
      <div role="row"><div role="gridcell">cat blanket</div><div role="gridcell">960</div><div role="gridcell">3,100</div></div>
    </div>`;

    expect(extractErankKeywords().rows).toEqual([
      { keyword: "cat blanket", searches: "960", competition: "3,100", clicks: "", ctr: "" },
    ]);
  });

  it("recognises the login page", () => {
    history.replaceState({}, "", "/login");
    document.body.innerHTML = '<form><input type="email" /><input type="password" /></form>';

    expect(extractErankKeywords()).toMatchObject({ loggedOut: true, rows: [] });
  });

  it("ignores tables that are not a keyword table", () => {
    document.body.innerHTML = "<table><tr><th>Shop</th><th>Sales</th></tr><tr><td>A</td><td>1</td></tr></table>";

    expect(extractErankKeywords()).toMatchObject({ loggedOut: false, rows: [], hidden: 0 });
  });
});
