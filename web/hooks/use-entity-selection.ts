import { useCallback, useEffect } from "react";
// hooks
import { useBulkIssueOperations } from "@/hooks/store";

export const useEntitySelection = () => {
  // store hooks
  const { clearSelection, getIsIssueSelected, toggleIssueSelection } = useBulkIssueOperations();

  const handleClick = useCallback(
    (e: React.MouseEvent, issueId: string) => {
      const isIssueSelected = getIsIssueSelected(issueId);
      // const element = document.querySelector(`[data-element-id="${issueId}"]`);
      if (e.shiftKey) {
        console.log("shift key");
        if (isIssueSelected) return;
      }
      toggleIssueSelection(issueId);
    },
    [getIsIssueSelected, toggleIssueSelection]
  );

  useEffect(() => {}, []);

  // clear selection on escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearSelection();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [clearSelection]);

  return {
    handleClick,
  };
};
