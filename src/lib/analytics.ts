// Umami custom events. No-op until Umami is configured and its script has loaded.

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, string>) => void };
  }
}

export function track(event: string, data?: Record<string, string>): void {
  if (typeof window === "undefined") return;
  window.umami?.track(event, data);
}
