import { SmoothCursorToggle } from "./smooth-cursor-toggle";
import { ThemeSwitcher } from "./theme-switcher";

export interface PreferenceOption {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<{ option: PreferenceOption }>;
}

export const PREFERENCE_OPTIONS: PreferenceOption[] = [
  {
    id: "theme",
    title: "Theme",
    description: "Select or customize your interface color scheme.",
    component: ThemeSwitcher,
  },
  {
    id: "smoothCursor",
    title: "Smooth cursor movement",
    description: "Select the cursor motion style that feels right for you",
    component: SmoothCursorToggle,
  },
];
