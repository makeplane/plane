import type { LucideIcon } from "lucide-react";

export type TSidebarMenuItem = {
  Icon: LucideIcon | React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
  href: string;
};
