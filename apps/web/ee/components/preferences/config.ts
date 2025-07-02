import { PREFERENCE_COMPONENTS as CE_PREFERENCE_COMPONENTS } from "@/ce/components/preferences/config";
import { SmoothCursorToggle } from "./smooth-cursor-toggle";

export const PREFERENCE_COMPONENTS = {
  ...CE_PREFERENCE_COMPONENTS,
  smooth_cursor: SmoothCursorToggle,
};
