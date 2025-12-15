import type { ReactNode } from "react";

export type TTabNavigationItemProps = {
  /** The content to display inside the tab (icons, text, etc.) */
  children: ReactNode;
  /** Whether this tab is currently active */
  isActive: boolean;
  /** Additional CSS class names */
  className?: string;
};

export type TTabNavigationListProps = {
  /** The navigation items (each should be a TabNavigationItem wrapped in a routing component) */
  children: ReactNode;
  /** Additional CSS class names for the container */
  className?: string;
};
