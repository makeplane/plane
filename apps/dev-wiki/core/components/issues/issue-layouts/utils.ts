// Minimal utils for dev-wiki - only what's needed for sidebar functionality
export const HIGHLIGHT_CLASS = "bg-yellow-50 border-yellow-200";

export const highlightIssueOnDrop = (elementId: string, timeout: number = 3000) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.add(HIGHLIGHT_CLASS);
    setTimeout(() => {
      element.classList.remove(HIGHLIGHT_CLASS);
    }, timeout);
  }
};
