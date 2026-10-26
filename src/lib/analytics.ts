// Plausible custom events. No-op when Plausible is not configured.

type Plausible = ((
  event: string,
  options?: { props?: Record<string, string> },
) => void) & { q?: unknown[] };

declare global {
  interface Window {
    plausible?: Plausible;
  }
}

export function track(event: string, props?: Record<string, string>): void {
  if (typeof window === "undefined" || !window.plausible) return;
  window.plausible(event, props ? { props } : undefined);
}
