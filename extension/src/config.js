/**
 * Build-time settings for whoever distributes the extension. Edit these before
 * zipping it for customers; nothing here is shown or editable in the popup.
 */
export const CONFIG = Object.freeze({
  /** The NicheDesk server that checks license keys (POST /api/licenses/verify). */
  licenseServerUrl: "http://localhost:3000",

  /** Shown as "Need a license key? Contact us" — e.g. "https://wa.me/923001234567". Empty hides it. */
  contactUrl: "",

  /**
   * Pre-filled Etsy API key. Leave empty to have each customer paste their own.
   * If you ship one shared key, Etsy requires your app to be approved for
   * commercial access first.
   */
  defaultEtsyApiKey: "",

  erankBaseUrl: "https://members.erank.com",
  etsyApiBase: "https://openapi.etsy.com/v3/application",

  /** Re-check a valid license with the server this often. */
  licenseRecheckHours: 12,
  /** Keep working this long on a previously valid license if the server is unreachable. */
  licenseOfflineGraceDays: 3,
});
