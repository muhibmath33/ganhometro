"use client";

import { useEffect, useState } from "react";

// The current time, ticking. It starts from the server's clock, so the first render matches the
// HTML, and keeps the server's offset, so a phone with a wrong clock still shows the right time.
export function useNow(serverNow: number, intervalMs: number) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const offset = serverNow - Date.now();
    const id = setInterval(() => setNow(Date.now() + offset), intervalMs);
    return () => clearInterval(id);
  }, [serverNow, intervalMs]);
  // After a server action re-renders the page, serverNow is newer than the last tick.
  return Math.max(now, serverNow);
}
