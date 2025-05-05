export const openProjectAndScrollToSidebar = (
  item: any,
  toggleProjectListOpen: (id: string, open: boolean) => void
) => {
  const itemProjectId = item.project_id || (item.project_ids && item.project_ids[0]) || undefined;
  if (!itemProjectId) return;
  // open the project list
  toggleProjectListOpen(itemProjectId, true);
  // scroll to the element
  const scrollElementId = `sidebar-${itemProjectId}-JOINED`;
  const scrollElement = document.getElementById(scrollElementId);
  // if the element exists, scroll to it
  if (scrollElement) {
    setTimeout(() => {
      scrollElement.scrollIntoView({ behavior: "smooth", block: "start" });
      // Restart the highlight animation every time
      scrollElement.style.animation = "none";
      void scrollElement.offsetWidth;
      scrollElement.style.animation = "highlight 2s ease-in-out";
    });
  }
};
