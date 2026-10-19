/** Capabilities the client needs from its host (browser today; PWA / Tauri / Electron later). */
export interface Platform {
  /** Backend origin. Same-origin in the browser; an absolute URL inside a native shell. */
  apiBaseUrl: string;
}
