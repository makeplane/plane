import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";

export const isSidebarToggleVisible = () => {
  if (isDesktopApp()) return false;
  return true;
};
