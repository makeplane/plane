import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../utils";
import type { TTabNavigationItemProps } from "./tab-navigation-types";

export function TabNavigationItem({ children, isActive, className }: TTabNavigationItemProps) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-2 rounded-md px-2 py-1.5 text-13 font-medium transition-colors z-10",
        isActive ? "text-primary" : "text-secondary hover:text-primary hover:bg-layer-transparent-hover",
        className
      )}
    >
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute inset-0 bg-layer-transparent-active rounded-md -z-10"
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
