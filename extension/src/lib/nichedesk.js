/**
 * Sends report keywords into a NicheDesk workspace through its own API, so they
 * land in the niche tree ready for the Upcoming Work queue.
 */

async function call(baseUrl, path, init, fetchImpl, password) {
  const headers = {
    ...(init?.body ? { "content-type": "application/json" } : {}),
    // A password-locked NicheDesk accepts its password as a bearer token.
    ...(password ? { authorization: `Bearer ${password}` } : {}),
  };
  let response;
  try {
    response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}${path}`, { ...init, headers });
  } catch {
    throw new Error(`Could not reach NicheDesk at ${baseUrl}. Is it running?`);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      response.status === 401
        ? "NicheDesk is password protected — enter its password in Settings → NicheDesk workspace."
        : (body.error ?? `NicheDesk returned HTTP ${response.status}`);
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function listNiches(baseUrl, { password = "", fetchImpl = (...a) => fetch(...a) } = {}) {
  const data = await call(baseUrl, "/api/data", undefined, fetchImpl, password);
  return Array.isArray(data.niches) ? data.niches : [];
}

/**
 * Creates the niche (or reuses one with the same name under the same parent)
 * and imports the keywords into it. NicheDesk skips keywords the niche already
 * holds, so sending the same report twice is harmless.
 */
export async function sendToNicheDesk({
  baseUrl,
  password = "",
  nicheName,
  parentId = null,
  keywords,
  fetchImpl = (...a) => fetch(...a),
}) {
  const name = nicheName.trim();
  if (!name) throw new Error("Give the niche a name.");
  if (keywords.length === 0) throw new Error("There are no keywords to send.");

  let nicheId;
  let createdNiche = true;
  try {
    const niche = await call(
      baseUrl,
      "/api/niches",
      { method: "POST", body: JSON.stringify({ name, parentId }) },
      fetchImpl,
      password,
    );
    nicheId = niche.id;
  } catch (error) {
    if (error.status !== 400 || !/already exists/i.test(error.message)) throw error;
    const existing = (await listNiches(baseUrl, { password, fetchImpl })).find(
      (niche) => niche.name.toLowerCase() === name.toLowerCase() && (niche.parentId ?? null) === parentId,
    );
    if (!existing) throw error;
    nicheId = existing.id;
    createdNiche = false;
  }

  const result = await call(
    baseUrl,
    "/api/keywords/import",
    {
      method: "POST",
      body: JSON.stringify({
        nicheId,
        rows: keywords.map((keyword, index) => ({
          id: `ext-${index}`,
          keyword: keyword.keyword,
          volume: Math.round(keyword.searches ?? 0),
          competition: Math.round(keyword.competition ?? 0),
        })),
      }),
    },
    fetchImpl,
    password,
  );

  return { nicheId, createdNiche, added: result.added, skipped: result.skipped };
}

/**
 * Drops keywords read off an eRank page into the NicheDesk inbox, where they
 * wait to be opened in Sort Keyword. The server checks the license key; no
 * niche is touched until the user picks one in the desk.
 */
export async function sendToInbox({ baseUrl, key, deviceId, label = "", rows, fetchImpl = (...a) => fetch(...a) }) {
  if (!key) throw new Error("Add your license key in the extension’s Settings → Connection first.");

  const clean = rows
    .map((row) => ({
      keyword: String(row.keyword ?? "").trim(),
      volume: Math.max(0, Math.round(Number(row.searches ?? row.volume ?? 0))) || 0,
      competition: Math.max(0, Math.round(Number(row.competition ?? 0))) || 0,
    }))
    .filter((row) => row.keyword !== "")
    .slice(0, 5000);
  if (clean.length === 0) throw new Error("There are no keywords to send.");

  const body = await call(
    baseUrl,
    "/api/extension/inbox",
    {
      method: "POST",
      body: JSON.stringify({ key, deviceId, label: String(label).slice(0, 200), source: "erank", rows: clean }),
    },
    fetchImpl,
    "",
  );
  return { count: body.count, label: body.label };
}
