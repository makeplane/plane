// extensions
import { SideMenuHandleOptions, SideMenuPluginProps } from "@/extensions";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const AIHandlePlugin = (options: SideMenuPluginProps): SideMenuHandleOptions => {
  const view = () => {};
  const domEvents = {};

  return {
    view,
    domEvents,
  };
};
