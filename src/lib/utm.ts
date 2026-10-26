// UTM pass-through: remember the campaign that brought the visitor so the
// signup can be attributed in Brevo, even after they visit another page.

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type Utm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

const STORAGE_KEY = "gm_utm";

function fromSearch(search: string): Utm {
  const params = new URLSearchParams(search);
  const utm: Utm = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) utm[key] = value.slice(0, 200);
  }
  return utm;
}

// Last touch wins: a new campaign link replaces the stored one.
export function rememberUtm(): void {
  const utm = fromSearch(window.location.search);
  if (Object.keys(utm).length === 0) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(utm));
  } catch {
    // Storage blocked (private mode, etc.): the current URL still works.
  }
}

export function getUtm(): Utm {
  const current = fromSearch(window.location.search);
  if (Object.keys(current).length > 0) return current;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Utm) : {};
  } catch {
    return {};
  }
}
