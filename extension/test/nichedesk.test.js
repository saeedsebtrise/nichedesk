import { describe, expect, it, vi } from "vitest";

import { listNiches, sendToNicheDesk } from "../src/lib/nichedesk.js";

const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

describe("sendToNicheDesk", () => {
  it("creates the niche, imports the keywords, and sends the workspace password", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(reply(200, { id: "niche-1" }))
      .mockResolvedValueOnce(reply(200, { added: 2, skipped: 0 }));

    const result = await sendToNicheDesk({
      baseUrl: "https://desk.example.com/",
      password: "s3cret",
      nicheName: " pet blanket ",
      keywords: [
        { keyword: "a b", searches: 900.4, competition: 100 },
        { keyword: "c d", searches: 800, competition: 200 },
      ],
      fetchImpl,
    });

    expect(result).toEqual({ nicheId: "niche-1", createdNiche: true, added: 2, skipped: 0 });
    const [nicheUrl, nicheInit] = fetchImpl.mock.calls[0];
    expect(nicheUrl).toBe("https://desk.example.com/api/niches");
    expect(nicheInit.headers.authorization).toBe("Bearer s3cret");
    expect(JSON.parse(nicheInit.body)).toEqual({ name: "pet blanket", parentId: null });
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body).rows[0]).toEqual({
      id: "ext-0",
      keyword: "a b",
      volume: 900,
      competition: 100,
    });
  });

  it("reuses a niche that already exists under the same parent", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(reply(400, { error: "That niche already exists." }))
      .mockResolvedValueOnce(reply(200, { niches: [{ id: "old", name: "Pet Blanket", parentId: null }] }))
      .mockResolvedValueOnce(reply(200, { added: 0, skipped: 1 }));

    const result = await sendToNicheDesk({
      baseUrl: "http://localhost:3000",
      nicheName: "pet blanket",
      keywords: [{ keyword: "a b", searches: 1, competition: 1 }],
      fetchImpl,
    });

    expect(result).toMatchObject({ nicheId: "old", createdNiche: false, skipped: 1 });
  });

  it("sends no authorization header when there is no password", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reply(200, { niches: [] }));

    await listNiches("http://localhost:3000", { fetchImpl });

    expect(fetchImpl.mock.calls[0][1].headers).not.toHaveProperty("authorization");
  });

  it("explains a locked workspace", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reply(401, { error: "Log in to NicheDesk first." }));

    await expect(listNiches("https://desk.example.com", { fetchImpl })).rejects.toThrow(/password protected/);
  });

  it("refuses to send nothing", async () => {
    await expect(
      sendToNicheDesk({ baseUrl: "http://x", nicheName: "n", keywords: [], fetchImpl: vi.fn() }),
    ).rejects.toThrow(/no keywords/);
  });
});
