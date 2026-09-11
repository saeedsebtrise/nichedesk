import { CONFIG } from "./config.js";
import { readErankKeywords } from "./lib/erank.js";
import { createEtsyClient } from "./lib/etsy.js";
import { checkLicense, describeLicense, getDeviceId, licenseGate } from "./lib/license.js";
import { runPipeline } from "./lib/pipeline.js";
import { getSeedInfo, saveReport } from "./lib/reports.js";
import { loadSettings } from "./lib/settings.js";
import { log, resetState, setState } from "./lib/state.js";

/**
 * Service worker: owns the running pipeline. The popup only sends messages and
 * watches chrome.storage, so closing it never interrupts a run.
 */

let controller = null;

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Stopped", "AbortError"));
      },
      { once: true },
    );
  });

async function ensureLicense(settings, endpoints) {
  const key = settings.licenseKey;
  if (!key) return { ok: false, message: "Enter your license key in Settings → Connection." };

  const { licenseCache } = await chrome.storage.local.get("licenseCache");
  const gate = licenseGate(licenseCache, key, new Date(), {
    recheckHours: CONFIG.licenseRecheckHours,
    graceDays: CONFIG.licenseOfflineGraceDays,
  });
  if (gate.ok) return { ok: true };

  const result = await checkLicense({ key, serverUrl: endpoints.licenseServerUrl, deviceId: await getDeviceId() });
  if (!result.offline) await chrome.storage.local.set({ licenseCache: result });

  if (result.valid) {
    await log("License verified");
    return { ok: true };
  }
  if (result.offline && gate.withinGrace) {
    await log("License server unreachable — using your last successful check", "warn");
    return { ok: true };
  }
  return { ok: false, message: describeLicense(result) };
}

async function startRun({ from = 1, seed, productType, useOpenTab, csvRows }) {
  if (controller) return { ok: false, error: "A run is already in progress." };

  const { settings, endpoints } = await loadSettings();

  const license = await ensureLicense(settings, endpoints);
  if (!license.ok) {
    await setState({ status: "error", title: "License needed", detail: license.message });
    await log(license.message, "error");
    return { ok: false, error: license.message };
  }

  // Check before Step 1 spends one of the user's eRank searches.
  if (from <= 2 && !settings.etsyApiKey) {
    const message = "Add your Etsy API key in Settings → Etsy API — Step 2 needs it.";
    await setState({ status: "error", title: "Etsy API key needed", detail: message });
    await log(message, "error");
    return { ok: false, error: message };
  }

  controller = new AbortController();
  const { signal } = controller;
  // Calling an extension API resets the service worker's idle timer; this
  // keeps a long run alive through quiet stretches.
  const keepAlive = setInterval(() => chrome.runtime.getPlatformInfo(), 20_000);

  const label = from === 1 ? "Full pipeline" : `Step ${from}`;
  await resetState({ status: "running", step: from, title: `${label} for “${seed}”`, seed });
  await log(`=== Starting ${label.toLowerCase()} for “${seed}” ===`);

  const deps = {
    getKeywordRows: (seedText, options) =>
      readErankKeywords(seedText, {
        baseUrl: endpoints.erankBaseUrl,
        country: settings.erankCountry,
        useOpenTab: options.useOpenTab,
        signal,
        sleep,
        log: (message, level) => log(message, level),
      }),
    etsy: createEtsyClient({ apiKey: settings.etsyApiKey, baseUrl: endpoints.etsyApiBase, signal }),
    loadRun: async () => (await chrome.storage.local.get("lastRun")).lastRun ?? null,
    saveRun: (run) => chrome.storage.local.set({ lastRun: run }),
    saveReport: (report) => saveReport(report),
    newId: () => `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 6)}`,
    now: () => new Date(),
    log: (message, level) => log(message, level),
    step: (step, title, detail = "") => setState({ status: "running", step, title, detail }),
  };

  // Deliberately not awaited: the popup gets its answer now and follows the
  // run through chrome.storage.
  runPipeline({ from, input: { seed, productType, useOpenTab, csvRows }, settings, deps, signal })
    .then(async (report) => {
      await setState({
        status: "done",
        step: 4,
        title: `Done: “${report.seed}” → ${report.verdict}`,
        detail: report.headline,
        reportId: report.id,
        verdict: report.verdict,
      });
      await log(`=== Pipeline complete for “${report.seed}” — ${report.verdict} ===`);
      await chrome.tabs.create({ url: chrome.runtime.getURL(`src/report/report.html?id=${report.id}`) });
    })
    .catch(async (error) => {
      if (error?.name === "AbortError") {
        await setState({ status: "stopped", title: "Stopped", detail: "The run was stopped before it finished." });
        await log("Run stopped", "warn");
        return;
      }
      const { state } = await chrome.storage.session.get("state");
      await setState({ status: "error", title: `Stopped at Step ${state?.step || from}`, detail: error.message });
      await log(error.message, "error");
    })
    .finally(() => {
      clearInterval(keepAlive);
      controller = null;
    });

  return { ok: true };
}

async function handle(message) {
  switch (message?.type) {
    case "run":
      return startRun(message);

    case "stop":
      controller?.abort();
      return { ok: true };

    case "license:check": {
      const { endpoints } = await loadSettings();
      const result = await checkLicense({
        key: String(message.key ?? "").trim(),
        serverUrl: endpoints.licenseServerUrl,
        deviceId: await getDeviceId(),
      });
      if (!result.offline) await chrome.storage.local.set({ licenseCache: result });
      return result;
    }

    case "etsy:ping": {
      const { endpoints } = await loadSettings();
      try {
        const client = createEtsyClient({ apiKey: String(message.apiKey ?? "").trim(), baseUrl: endpoints.etsyApiBase });
        const data = await client.ping();
        return { ok: true, applicationId: data.application_id ?? null };
      } catch (error) {
        return { ok: false, error: error.message };
      }
    }

    case "seed:info":
      return getSeedInfo(String(message.seed ?? ""));

    default:
      return { ok: false, error: "Unknown request" };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handle(message).then(sendResponse, (error) => sendResponse({ ok: false, error: error.message }));
  return true; // keeps the channel open for the async answer
});

// A service worker restart mid-run loses the run; say so instead of showing "running" forever.
chrome.runtime.onStartup.addListener(async () => {
  const { state } = await chrome.storage.session.get("state");
  if (state?.status === "running") await setState({ status: "stopped", title: "Interrupted", detail: "The browser closed mid-run." });
});
