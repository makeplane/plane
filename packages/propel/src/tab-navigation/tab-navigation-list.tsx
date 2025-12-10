import type { FC } from "react";
import { LayoutGroup } from "framer-motion";
import { cn } from "../utils";
import type { TTabNavigationListProps } from "./tab-navigation-types";

export function TabNavigationList({ children, className }: TTabNavigationListProps) {
  return (
    <LayoutGroup id="tab-navigation">
      <div className={cn("relative flex items-center gap-1 rounded-md", className)}>{children}</div>
    </LayoutGroup>
  );
}

TabNavigationList.displayName = "TabNavigationList";
