import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Files, FolderOpen } from "lucide-react";
// ui
import { Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme } from "@/hooks/store";
// plane web hooks
import { useFlag } from "@/plane-web/hooks/store/use-flag";

const APPS_LIST = [
  {
    key: "projects",
    label: "Projects",
    icon: FolderOpen,
    color: "#5472e4",
    href: "/",
  },
  {
    key: "pages",
    label: "Wiki",
    icon: Files,
    color: "#17a68c",
    href: "/pages",
  },
];

export const SidebarAppSwitcher = observer(() => {
  // params
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  const isWorkspacePagesEnabled = useFlag(workspaceSlug?.toString(), "WORKSPACE_PAGES");

  const isPagesApp = pathname.includes(`/${workspaceSlug.toString()}/pages`);

  if (!isWorkspacePagesEnabled) return null;

  return (
    <div
      className={cn("flex items-center gap-0.5 rounded-md p-0.5 bg-custom-sidebar-background-80/50 mb-4", {
        "flex-col w-[34px] mx-auto": sidebarCollapsed,
      })}
    >
      {APPS_LIST.map((app) => {
        const isSelected = (app.key === "pages" && isPagesApp) || (app.key === "projects" && !isPagesApp);

        return (
          <Tooltip
            key={app.key}
            tooltipHeading={app.label}
            tooltipContent=""
            position="right"
            disabled={!sidebarCollapsed}
          >
            <Link
              href={`/${workspaceSlug}${app.href}`}
              className={cn(
                "w-1/2 rounded flex items-center justify-center gap-2 text-sm font-medium text-center py-2 px-6",
                {
                  "p-0 size-8 aspect-square": sidebarCollapsed,
                  "bg-custom-sidebar-background-100 border-[0.5px] border-custom-border-300": isSelected,
                  "hover:bg-custom-sidebar-background-80": !isSelected,
                }
              )}
            >
              <app.icon
                className="flex-shrink-0 size-4"
                style={{
                  color: app.color,
                }}
              />
              {!sidebarCollapsed && <span>{app.label}</span>}
            </Link>
          </Tooltip>
        );
      })}
    </div>
  );
});
