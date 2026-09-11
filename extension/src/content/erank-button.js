/**
 * Adds a "Send to NicheDesk" button to eRank's Keyword Tool. A click asks the
 * extension's background worker to read the keyword table on this page and
 * drop it into the NicheDesk inbox.
 *
 * A plain script (content scripts cannot be modules), drawn inside a shadow
 * root so eRank's styles and ours never mix.
 */
(() => {
  if (window.__nicheDeskButton) return;
  window.__nicheDeskButton = true;

  const host = document.createElement("div");
  host.id = "nichedesk-send";
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
    <style>
      :host { all: initial; }
      .wrap {
        position: fixed; right: 20px; bottom: 20px; z-index: 2147483647;
        display: flex; flex-direction: column; align-items: flex-end; gap: 10px;
        font: 600 14px/1.35 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      }
      button {
        display: inline-flex; align-items: center; gap: 8px; border: 0; border-radius: 999px;
        padding: 12px 18px; background: #f4671f; color: #fff; font: inherit; cursor: pointer;
        box-shadow: 0 12px 30px -8px rgba(244, 103, 31, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.3);
        transition: transform 0.15s, background 0.15s;
      }
      button:hover { background: #ff7a36; transform: translateY(-1px); }
      button:disabled { opacity: 0.75; cursor: progress; transform: none; }
      .logo {
        display: grid; place-items: center; width: 20px; height: 20px; border-radius: 6px;
        background: rgba(255, 255, 255, 0.22); font-weight: 900; font-size: 12px;
      }
      .toast {
        max-width: 320px; padding: 12px 14px; border-radius: 14px; background: #150e0a; color: #f3dfcf;
        border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.6);
        font-weight: 500;
      }
      .toast strong { display: block; margin-bottom: 2px; color: #fff; font-weight: 700; }
      .toast.error strong { color: #fca5a5; }
      .toast a { color: #ffab7d; font-weight: 700; }
      [hidden] { display: none !important; }
    </style>
    <div class="wrap">
      <div class="toast" role="status" hidden></div>
      <button type="button"><span class="logo" aria-hidden="true">N</span><span class="label">Send to NicheDesk</span></button>
    </div>`;

  const button = root.querySelector("button");
  const label = root.querySelector(".label");
  const toast = root.querySelector(".toast");
  let hideTimer;

  const show = (title, detail, { error = false, link } = {}) => {
    toast.className = error ? "toast error" : "toast";
    const strong = document.createElement("strong");
    strong.textContent = title;
    toast.replaceChildren(strong, detail);
    if (link) {
      const anchor = document.createElement("a");
      anchor.href = link;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = "Open NicheDesk →";
      toast.append(" ", anchor);
    }
    toast.hidden = false;
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      toast.hidden = true;
    }, 9000);
  };

  button.addEventListener("click", async () => {
    button.disabled = true;
    label.textContent = "Sending…";
    try {
      const result = await chrome.runtime.sendMessage({ type: "erank:send-to-inbox" });
      if (result?.ok) {
        const skipped = result.hidden > 0 ? ` ${result.hidden} blurred rows were left out.` : "";
        show(`Sent ${result.count} keywords`, `They are waiting in Sort Keyword → Inbox.${skipped}`, {
          link: result.appUrl,
        });
      } else {
        show("Could not send", result?.error ?? "The extension did not answer.", { error: true });
      }
    } catch {
      show("Could not send", "Reload this page — the extension was updated since it opened.", { error: true });
    } finally {
      button.disabled = false;
      label.textContent = "Send to NicheDesk";
    }
  });

  // eRank is a single-page app, so keep checking which page is showing.
  const sync = () => {
    host.style.display = location.pathname.startsWith("/keyword-tool") ? "" : "none";
  };
  sync();
  setInterval(sync, 1000);
  document.documentElement.append(host);
})();
