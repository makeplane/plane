import { useCallback, useEffect, useState } from "react";

const useReloadConfirmations = (message?: string, isActive = true) => {
  const [showAlert, setShowAlert] = useState(false);

  const handleBeforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if(!isActive) return;
      event.preventDefault();
      event.returnValue = "";
      return message ?? "Are you sure you want to leave?";
    },
    [message, isActive]
  );

  useEffect(() => {
    if (!showAlert) {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      return;
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [handleBeforeUnload, showAlert]);

  return { setShowAlert };
};

export default useReloadConfirmations;
