import { useState, useEffect } from "react";

const useOnlineStatus = () => {
  // states
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  const updateOnlineStatus = () => setIsOnline(navigator.onLine);

  useEffect(() => {
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  return { isOnline };
};

export default useOnlineStatus;
