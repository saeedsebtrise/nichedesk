import { listNiches, sendToNicheDesk } from "../lib/nichedesk.js";
import {
  REPORT_CSS,
  renderReportBody,
  renderStandaloneReport,
  reportCsv,
  reportFileName,
} from "../lib/report-html.js";
import { getReport } from "../lib/reports.js";
import { loadSettings } from "../lib/settings.js";

const $ = (id) => document.getElementById(id);

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function result(text, tone) {
  $("sendResult").textContent = text;
  $("sendResult").className = tone ?? "";
}

async function openSendPanel(report) {
  const { settings } = await loadSettings();
  $("send").hidden = false;
  $("sendName").value = report.seed;
  const qualified = report.keywords.filter((keyword) => keyword.status === "qualified").length;
  $("sendHint").textContent =
    `Creates a niche in ${settings.nicheDeskUrl} (or reuses one with the same name) and imports the keywords ` +
    `with their searches and competition. ${qualified} qualified, ${report.keywords.length} evaluated.`;
  result("");

  try {
    const niches = await listNiches(settings.nicheDeskUrl, { password: settings.nicheDeskPassword });
    const select = $("sendParent");
    select.replaceChildren(select.options[0]);
    for (const niche of niches.sort((a, b) => a.name.localeCompare(b.name))) {
      const option = document.createElement("option");
      option.value = niche.id;
      option.textContent = niche.name;
      select.append(option);
    }
  } catch (error) {
    result(error.message, "bad");
  }
}

async function send(report) {
  const { settings } = await loadSettings();
  const which = $("sendWhich").value;
  const keywords = report.keywords.filter((keyword) => which === "all" || keyword.status === "qualified");
  result("Sending…");
  try {
    const outcome = await sendToNicheDesk({
      baseUrl: settings.nicheDeskUrl,
      password: settings.nicheDeskPassword,
      nicheName: $("sendName").value,
      parentId: $("sendParent").value || null,
      keywords,
    });
    result(
      `${outcome.createdNiche ? "Created the niche and added" : "Added"} ${outcome.added} keyword(s)` +
        (outcome.skipped ? ` · ${outcome.skipped} were already there` : ""),
      "good",
    );
  } catch (error) {
    result(error.message, "bad");
  }
}

async function init() {
  const style = document.createElement("style");
  style.textContent = REPORT_CSS;
  document.head.append(style);

  const id = new URLSearchParams(location.search).get("id");
  const report = id ? await getReport(id) : null;
  if (!report) {
    $("report").innerHTML = '<p class="nd-muted">This report is no longer stored. Reports are kept for your last 30 runs.</p>';
    return;
  }

  document.title = `${report.verdict} · ${report.seed} — NicheDesk Research`;
  // renderReportBody escapes every piece of Etsy and eRank data it inserts.
  $("report").innerHTML = renderReportBody(report);

  $("downloadHtml").addEventListener("click", () =>
    download(reportFileName(report), renderStandaloneReport(report), "text/html"),
  );
  $("exportCsv").addEventListener("click", () =>
    download(reportFileName(report, "csv"), reportCsv(report), "text/csv"),
  );
  $("exportJson").addEventListener("click", () =>
    download(reportFileName(report, "json"), JSON.stringify(report, null, 2), "application/json"),
  );
  $("print").addEventListener("click", () => window.print());

  const hasKeywords = report.keywords.length > 0;
  $("openSend").disabled = !hasKeywords;
  $("openSend").title = hasKeywords ? "" : "A report stopped at Step 1 has no evaluated keywords to send.";
  $("openSend").addEventListener("click", () => openSendPanel(report));
  $("sendCancel").addEventListener("click", () => ($("send").hidden = true));
  $("sendGo").addEventListener("click", () => send(report));
}

init();
