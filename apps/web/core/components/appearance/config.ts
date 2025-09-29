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
    title: "theme",
    description: "select_or_customize_your_interface_color_scheme",
    component: ThemeSwitcher,
  },
  {
    id: "smooth_cursor",
    title: "smooth_cursor",
    description: "select_the_cursor_motion_style_that_feels_right_for_you",
    component: SmoothCursorToggle,
  },
];
