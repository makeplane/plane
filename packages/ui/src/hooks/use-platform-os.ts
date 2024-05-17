import { useEffect, useState } from "react";

export const usePlatformOS = () => {
  // states
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

    if (isMobile) setIsMobile(isMobile);
  }, []);

  return { isMobile };
};
