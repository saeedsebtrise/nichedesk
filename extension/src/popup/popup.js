import { CONFIG } from "../config.js";
import { parseErankCsv } from "../lib/csv.js";
import { describeLicense } from "../lib/license.js";
import { listNiches } from "../lib/nichedesk.js";
import { COUNTRY_OPTIONS, loadSettings, saveSettings } from "../lib/settings.js";
import { formatLogLine } from "../lib/state.js";

const $ = (id) => document.getElementById(id);
const send = (message) => chrome.runtime.sendMessage(message);

const NUMBER_FIELDS = [
  "minSearches",
  "maxCompetition",
  "minWords",
  "maxKeywords",
  "topListings",
  "maxShopReviews",
  "minBeatableSlots",
  "minQualifiedKeywords",
  "maxAudits",
];

let csv = null; // { name, rows } while a CSV import is armed
let pendingFrom = null;
let logLines = [];

function showError(message) {
  const box = $("formError");
  box.textContent = message ?? "";
  box.hidden = !message;
}

function setHint(id, text, tone) {
  const el = $(id);
  el.textContent = text;
  el.className = `hint${tone ? ` ${tone}` : ""}`;
}

// ── Settings form ────────────────────────────────────────────────────────────

function fillSettings(settings) {
  for (const key of NUMBER_FIELDS) $(key).value = settings[key];
  $("licenseKey").value = settings.licenseKey;
  $("etsyApiKey").value = settings.etsyApiKey;
  $("nicheDeskUrl").value = settings.nicheDeskUrl;
  $("nicheDeskPassword").value = settings.nicheDeskPassword;
  $("requireSeedWord").checked = settings.requireSeedWord;
  $("erankCountry").value = settings.erankCountry;
}

function readSettingsForm() {
  const values = Object.fromEntries(NUMBER_FIELDS.map((key) => [key, $(key).value]));
  return {
    ...values,
    licenseKey: $("licenseKey").value,
    etsyApiKey: $("etsyApiKey").value,
    nicheDeskUrl: $("nicheDeskUrl").value,
    nicheDeskPassword: $("nicheDeskPassword").value,
    requireSeedWord: $("requireSeedWord").checked,
    erankCountry: $("erankCountry").value,
  };
}

/** Remote workspaces need a host permission; ask while we still have the click. */
function requestNicheDeskPermission(url) {
  try {
    const { protocol, hostname, origin } = new URL(url);
    if (protocol !== "https:" || hostname === "localhost") return Promise.resolve(true);
    return chrome.permissions.request({ origins: [`${origin}/*`] });
  } catch {
    return Promise.resolve(false);
  }
}

// ── Run state ────────────────────────────────────────────────────────────────

const PILL = {
  idle: "Ready",
  running: "Running",
  done: "Done",
  error: "Needs attention",
  stopped: "Stopped",
};

function renderState(state = {}) {
  const status = state.status ?? "idle";
  const pill = $("statusPill");
  pill.textContent = PILL[status] ?? status;
  pill.className = `pill pill--${status}`;

  $("stateTitle").textContent = state.title ?? "No task running";
  $("stateDetail").textContent = state.detail ?? "";

  for (const item of $("stepper").children) {
    const step = Number(item.dataset.step);
    item.className = "";
    if (status === "done" || (status === "running" && step < state.step)) item.classList.add("done");
    else if (status === "running" && step === state.step) item.classList.add("active");
    else if (status === "error" && step === state.step) item.classList.add("failed");
    else if ((status === "error" || status === "stopped") && step < state.step) item.classList.add("done");
  }

  const running = status === "running";
  $("startFull").disabled = running;
  $("startFull").textContent = running ? "Running…" : "Start full pipeline";
  for (const button of document.querySelectorAll(".btn--step")) button.disabled = running;
  $("stop").disabled = !running;
}

function renderLog(lines = []) {
  logLines = lines;
  const box = $("log");
  const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 30;
  box.replaceChildren(
    ...lines.map((entry) => {
      const line = document.createElement("div");
      line.className = entry.level;
      const time = document.createElement("time");
      time.textContent = formatLogLine({ ...entry, message: "" }).trim() + " ";
      line.append(time, entry.message);
      return line;
    }),
  );
  if (atBottom) box.scrollTop = box.scrollHeight;
}

function renderReports(index = []) {
  $("reportsPanel").hidden = index.length === 0;
  $("reports").replaceChildren(
    ...index.slice(0, 5).map((entry) => {
      const item = document.createElement("li");
      const verdict = document.createElement("span");
      verdict.className = `verdict verdict--${entry.verdict}`;
      verdict.textContent = entry.verdict;
      const seed = document.createElement("span");
      seed.className = "seed";
      seed.textContent = entry.seed;
      const when = document.createElement("time");
      when.textContent = new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const open = document.createElement("button");
      open.className = "text-btn";
      open.type = "button";
      open.textContent = "Open";
      open.addEventListener("click", () =>
        chrome.tabs.create({ url: chrome.runtime.getURL(`src/report/report.html?id=${entry.id}`) }),
      );
      item.append(verdict, seed, when, open);
      return item;
    }),
  );
}

function renderLicense(result, key) {
  if (!key) return setHint("licenseStatus", "Enter your license key to run the pipeline.", "bad");
  if (!result || result.key !== key) return setHint("licenseStatus", "Press Test to check this key.");
  setHint("licenseStatus", describeLicense(result), result.valid ? "good" : "bad");
}

// ── Starting a run ───────────────────────────────────────────────────────────

async function persistForm() {
  await chrome.storage.local.set({
    popupForm: { seed: $("seed").value, productType: $("productType").value, useOpenTab: $("useOpenTab").checked },
  });
}

async function start(from, confirmed = false) {
  showError(null);
  const seed = $("seed").value.trim();
  if (!seed) return showError("Enter a seed keyword first.");
  await persistForm();

  if (from === 1 && !confirmed) {
    const info = await send({ type: "seed:info", seed });
    if (info?.runs) {
      const when = new Date(info.lastRunAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      $("dupeText").textContent =
        `“${seed}” was researched ${info.runs} time(s), last on ${when} ` +
        `(${info.keywords} keywords, ${info.listings} listings, ${info.verdict}). ` +
        "Run again? It replaces that run and uses another eRank search.";
      $("dupeWarning").hidden = false;
      pendingFrom = from;
      return;
    }
  }

  const response = await send({
    type: "run",
    from,
    seed,
    productType: $("productType").value,
    useOpenTab: $("useOpenTab").checked,
    csvRows: from === 1 && csv ? csv.rows : null,
  });
  if (!response?.ok) showError(response?.error ?? "Could not start the run.");
}

// ── Wiring ───────────────────────────────────────────────────────────────────

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function wire() {
  $("startFull").addEventListener("click", () => start(1));
  for (const button of document.querySelectorAll(".btn--step")) {
    button.addEventListener("click", () => start(Number(button.dataset.from), true));
  }
  $("stop").addEventListener("click", () => send({ type: "stop" }));

  $("dupeContinue").addEventListener("click", () => {
    $("dupeWarning").hidden = true;
    if (pendingFrom) start(pendingFrom, true);
    pendingFrom = null;
  });
  $("dupeCancel").addEventListener("click", () => {
    $("dupeWarning").hidden = true;
    pendingFrom = null;
  });

  for (const id of ["seed", "productType", "useOpenTab"]) $(id).addEventListener("change", persistForm);

  $("csvFile").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const { rows, error } = parseErankCsv(await file.text());
    if (error) return showError(error);
    csv = { name: file.name, rows };
    const chip = $("csvChip");
    chip.replaceChildren(`${file.name} · ${rows.length} rows`);
    const clear = document.createElement("button");
    clear.type = "button";
    clear.title = "Stop using this CSV";
    clear.textContent = "×";
    clear.addEventListener("click", () => {
      csv = null;
      chip.hidden = true;
    });
    chip.append(clear);
    chip.hidden = false;
    showError(null);
  });

  $("logCopy").addEventListener("click", () =>
    navigator.clipboard.writeText(logLines.map(formatLogLine).join("\n")),
  );
  $("logClear").addEventListener("click", () => chrome.storage.session.set({ log: [] }));
  $("logExport").addEventListener("click", () =>
    download(`nichedesk-log-${new Date().toISOString().slice(0, 10)}.txt`, logLines.map(formatLogLine).join("\n"), "text/plain"),
  );

  $("testLicense").addEventListener("click", async () => {
    const key = $("licenseKey").value.trim();
    await saveSettings({ licenseKey: key });
    setHint("licenseStatus", "Checking…");
    renderLicense(await send({ type: "license:check", key }), key);
  });

  $("testEtsy").addEventListener("click", async () => {
    setHint("etsyStatus", "Checking…");
    const result = await send({ type: "etsy:ping", apiKey: $("etsyApiKey").value });
    if (result?.ok) setHint("etsyStatus", `Connected to the Etsy API${result.applicationId ? ` (app ${result.applicationId})` : ""}.`, "good");
    else setHint("etsyStatus", result?.error ?? "Etsy did not answer.", "bad");
  });

  $("testNicheDesk").addEventListener("click", async () => {
    const url = $("nicheDeskUrl").value.trim();
    const allowed = await requestNicheDeskPermission(url);
    if (!allowed) return setHint("nicheDeskStatus", "Permission to reach that address was declined.", "bad");
    setHint("nicheDeskStatus", "Checking…");
    try {
      const niches = await listNiches(url, { password: $("nicheDeskPassword").value.trim() });
      setHint("nicheDeskStatus", `Connected · ${niches.length} niche(s) in the workspace.`, "good");
    } catch (error) {
      setHint("nicheDeskStatus", error.message, "bad");
    }
  });

  $("saveSettings").addEventListener("click", async () => {
    const values = readSettingsForm();
    await requestNicheDeskPermission(values.nicheDeskUrl.trim());
    fillSettings(await saveSettings(values));
    $("savedNote").hidden = false;
    setTimeout(() => ($("savedNote").hidden = true), 1800);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "session" && changes.state) renderState(changes.state.newValue);
    if (area === "session" && changes.log) renderLog(changes.log.newValue ?? []);
    if (area === "local" && changes.reportIndex) renderReports(changes.reportIndex.newValue ?? []);
  });
}

async function init() {
  $("version").textContent = `v${chrome.runtime.getManifest().version}`;
  $("erankCountry").replaceChildren(
    ...COUNTRY_OPTIONS.map((code) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = code === "GLO" ? "Global" : code;
      return option;
    }),
  );
  if (CONFIG.contactUrl) {
    $("contactLink").href = CONFIG.contactUrl;
    $("contactLine").hidden = false;
  }

  const { settings } = await loadSettings();
  fillSettings(settings);

  const { popupForm, licenseCache, reportIndex } = await chrome.storage.local.get([
    "popupForm",
    "licenseCache",
    "reportIndex",
  ]);
  if (popupForm) {
    $("seed").value = popupForm.seed ?? "";
    $("productType").value = popupForm.productType ?? "any";
    $("useOpenTab").checked = Boolean(popupForm.useOpenTab);
  }
  renderLicense(licenseCache, settings.licenseKey);
  renderReports(reportIndex ?? []);

  const { state, log } = await chrome.storage.session.get(["state", "log"]);
  renderState(state);
  renderLog(log ?? []);
  $("log").scrollTop = $("log").scrollHeight;

  // First run: open settings so the license key is the first thing seen.
  if (!settings.licenseKey) $("settings").open = true;

  wire();
}

init();
