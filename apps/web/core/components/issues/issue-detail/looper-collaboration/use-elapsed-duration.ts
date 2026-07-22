import { useEffect, useState } from "react";

import { formatElapsedDuration } from "./delivery-overview-view";

export const useElapsedDuration = (createdAt?: string) => {
  const [duration, setDuration] = useState<string | null>(null);

  useEffect(() => {
    if (!createdAt) {
      setDuration(null);
      return;
    }
    const update = () => setDuration(formatElapsedDuration(createdAt, Date.now(), navigator.language));
    update();
    const interval = window.setInterval(update, 30_000);
    return () => window.clearInterval(interval);
  }, [createdAt]);

  return duration;
};
