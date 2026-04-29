"use client";

import { useIdleTimeout } from "@/lib/useIdleTimeout";

export default function IdleTimeoutHandler() {
  const TIMEOUT = 60 * 60 * 1000; //มิลลิวินาที
  useIdleTimeout(TIMEOUT);
  return null;
}
