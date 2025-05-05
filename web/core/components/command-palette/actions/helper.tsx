import { store } from "@/lib/store-context";

export const openProjectAndScrollToSidebar = (itemProjectId: string) => {
  if (!itemProjectId) return;
  // open the project list
  store.commandPalette.toggleProjectListOpen(itemProjectId, true);
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
