/**
 * The Sort Keyword tab owns the file picker and stays mounted, so anything
 * else in the tool (the top bar, the command palette, the overview) asks it to
 * open the picker through this window event rather than reaching into it.
 */
export const UPLOAD_EVENT = "nichedesk:upload";

export function requestUpload(): void {
  window.dispatchEvent(new Event(UPLOAD_EVENT));
}
