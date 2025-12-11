import type { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../utils";
import type { TTabNavigationItemProps } from "./tab-navigation-types";

export function TabNavigationItem({ children, isActive, className }: TTabNavigationItemProps) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors z-10",
        isActive ? "text-custom-text-100" : "text-custom-text-200 hover:text-custom-text-100",
        className
      )}
    >
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute inset-0 bg-custom-background-90 rounded-md -z-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}

TabNavigationItem.displayName = "TabNavigationItem";
