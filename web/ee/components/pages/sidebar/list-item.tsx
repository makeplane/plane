"use client";

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { FileText } from "lucide-react";
// ui
import { Tooltip } from "@plane/ui";
// components
import { Logo } from "@/components/common";
// helpers
import { cn } from "@/helpers/common.helper";
import { getPageName } from "@/helpers/page.helper";
// hooks
import { useAppTheme } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web hooks
import { useWorkspacePageDetails } from "@/plane-web/hooks/store";

type Props = {
  pageId: string;
};

export const PagesAppSidebarListItem: React.FC<Props> = observer((props) => {
  const { pageId } = props;
  // params
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // store hooks
  const { sidebarCollapsed: isCollapsed } = useAppTheme();
  const { isMobile } = usePlatformOS();
  // derived values
  const page = useWorkspacePageDetails(pageId);
  const isPageActive = pathname === `/${workspaceSlug}/pages/${page.id}`;

  if (!page) return null;

  return (
    <Tooltip tooltipContent={page.name} position="right" disabled={!isCollapsed} isMobile={isMobile}>
      <Link
        href={`/${workspaceSlug}/pages/${page.id}`}
        className={cn(
          "w-full flex items-center gap-1 py-1.5 px-1 rounded-md text-custom-sidebar-text-300 hover:bg-custom-sidebar-background-90",
          {
            "justify-center": isCollapsed,
            "bg-custom-primary-100/10 text-custom-primary-100": isPageActive,
          }
        )}
      >
        <span className="size-4 flex-shrink-0 grid place-items-center">
          {page.logo_props?.in_use ? (
            <Logo logo={page.logo_props} size={14} type="lucide" />
          ) : (
            <FileText className="size-3.5" />
          )}
        </span>
        {!isCollapsed && <p className="truncate text-sm">{getPageName(page.name)}</p>}
      </Link>
    </Tooltip>
  );
});
