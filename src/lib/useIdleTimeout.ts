"use client";

import { useEffect, useState, useCallback } from "react";
import { handleSignOut } from "./actions/actionAuths";

export function useIdleTimeout(timeout: number) {
  const [idle, setIdle] = useState(false);

  const handleSignOutFunction = useCallback(async () => {
    await handleSignOut();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const events = ["mousemove", "keydown", "mousedown", "touchstart"];

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(handleSignOutFunction, timeout);
    };

    // ตั้งค่า event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // เริ่ม timer ครั้งแรก
    resetTimer();

    // Cleanup function: จะทำงานเมื่อ component unmount
    return () => {
      clearTimeout(timer);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [timeout, handleSignOutFunction]);

  return idle;
}
