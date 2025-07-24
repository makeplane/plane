import { BarChart2, Briefcase, Home, Inbox, Layers, PenSquare } from "lucide-react";
import { ArchiveIcon, ContrastIcon, UserActivityIcon } from "@plane/ui";
import { cn } from "@plane/utils";

export const getSidebarNavigationItemIcon = (key: string, className: string = "") => {
  switch (key) {
    case "home":
      return <Home className={cn("size-4 flex-shrink-0", className)} />;
    case "inbox":
      return <Inbox className={cn("size-4 flex-shrink-0", className)} />;
    case "projects":
      return <Briefcase className={cn("size-4 flex-shrink-0", className)} />;
    case "views":
      return <Layers className={cn("size-4 flex-shrink-0", className)} />;
    case "active_cycles":
      return <ContrastIcon className={cn("size-4 flex-shrink-0", className)} />;
    case "analytics":
      return <BarChart2 className={cn("size-4 flex-shrink-0", className)} />;
    case "your_work":
      return <UserActivityIcon className={cn("size-4 flex-shrink-0", className)} />;
    case "drafts":
      return <PenSquare className={cn("size-4 flex-shrink-0", className)} />;
    case "archives":
      return <ArchiveIcon className={cn("size-4 flex-shrink-0", className)} />;
  }
};
