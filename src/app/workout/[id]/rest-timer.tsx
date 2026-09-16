"use client";

import { useEffect, useState } from "react";

export function RestTimer({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (remaining <= 0) return;
    const timeout = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timeout);
  }, [remaining]);

  if (dismissed || remaining <= 0) return null;

  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="mt-2 flex items-center justify-between rounded-md bg-neutral-100 px-3 py-2 text-sm">
      <span>
        Descanso: {mm}:{ss}
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-xs text-neutral-500 underline"
      >
        saltar
      </button>
    </div>
  );
}
