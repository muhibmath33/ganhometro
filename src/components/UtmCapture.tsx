"use client";

import { useEffect } from "react";
import { rememberUtm } from "@/lib/utm";

export function UtmCapture() {
  useEffect(() => {
    rememberUtm();
  }, []);
  return null;
}
