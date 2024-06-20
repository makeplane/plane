import { useCallback, useEffect, useState } from "react";

//TODO: remove temp flag isActive later and use showAlert as the source of truth
const useReloadConfirmations = (isActive = true) => {
  const [showAlert, setShowAlert] = useState(false);

  const handleBeforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (!isActive || !showAlert) return;
      event.preventDefault();
      event.returnValue = "";
    },
    [isActive, showAlert]
  );

  const handleAnchorClick = useCallback(
    (event: MouseEvent) => {
      if (!isActive || !showAlert) return;
      // Skip if event target is not available or defaultPrevented
      if (!event.target || event.defaultPrevented) return;
      // Skip control/command/option/alt+click
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      // check if the event target is an anchor or a child of an anchor tag
      const eventTarget = event.target as HTMLElement;
      if (!eventTarget.closest("a")) return; // This is intentionally not type safe
      // check if anchor target is _blank
      const anchorElement = eventTarget.closest("a") as HTMLAnchorElement;
      const isAnchorTargetBlank = anchorElement.getAttribute("target") === "_blank";
      if (isAnchorTargetBlank) return;
      // show confirm dialog
      const leave = confirm("Are you sure you want to leave? Changes you made may not be saved.");
      if (!leave) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [isActive, showAlert]
  );

  useEffect(() => {
    // handle browser refresh
    window.addEventListener("beforeunload", handleBeforeUnload, true);
    // handle anchor tag click
    window.addEventListener("click", handleAnchorClick, true);
    // TODO: handle back / forward button click

    return () => {
      // cleanup
      window.removeEventListener("beforeunload", handleBeforeUnload, true);
      window.removeEventListener("click", handleAnchorClick, true);
    };
  }, [handleAnchorClick, handleBeforeUnload]);

  return { setShowAlert };
};

export default useReloadConfirmations;
