import { useEffect, useState } from "react";

export const usePlatformOS = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [platform, setPlatform] = useState("");
  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    let detectedPlatform = "";

    if (isMobile) {
      setIsMobile(isMobile)
    } else {
      if (userAgent.indexOf("Win") !== -1) {
        detectedPlatform = "Windows";
      } else if (userAgent.indexOf("Mac") !== -1) {
        detectedPlatform = "MacOS";
      } else if (userAgent.indexOf("Linux") !== -1) {
        detectedPlatform = "Linux";
      } else {
        detectedPlatform = "Unknown";
      }
    };
    setPlatform(detectedPlatform);
  }, []);
  return { isMobile, platform };
};
