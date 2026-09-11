/**
 * Live run state and the activity log, kept in chrome.storage.session so the
 * popup can close and reopen mid-run and pick up exactly where things are.
 *
 * Writes are chained: log lines arrive in bursts, and parallel
 * read-modify-write cycles would otherwise drop some of them.
 */

export const IDLE_STATE = Object.freeze({
  status: "idle", // idle | running | done | error | stopped
  step: 0,
  title: "No task running",
  detail: "",
  seed: "",
  reportId: null,
  verdict: null,
});

const LOG_LIMIT = 400;
let queue = Promise.resolve();

function enqueue(work) {
  const next = queue.then(work, work);
  queue = next.catch(() => undefined);
  return next;
}

export function setState(patch, storage = chrome.storage.session) {
  return enqueue(async () => {
    const { state } = await storage.get("state");
    await storage.set({ state: { ...IDLE_STATE, ...state, ...patch } });
  });
}

export function resetState(patch = {}, storage = chrome.storage.session) {
  return enqueue(() => storage.set({ state: { ...IDLE_STATE, ...patch } }));
}

export function log(message, level = "info", storage = chrome.storage.session) {
  return enqueue(async () => {
    const { log: lines = [] } = await storage.get("log");
    lines.push({ t: Date.now(), level, message });
    await storage.set({ log: lines.slice(-LOG_LIMIT) });
  });
}

export function clearLog(storage = chrome.storage.session) {
  return enqueue(() => storage.set({ log: [] }));
}

export function formatLogLine(entry) {
  const time = new Date(entry.t).toLocaleTimeString("en-US", { hour12: true });
  return `[${time}] ${entry.message}`;
}
