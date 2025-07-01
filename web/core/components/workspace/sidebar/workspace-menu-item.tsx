import { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { SidebarNavItem } from "@/components/sidebar";
// hooks
import { useAppTheme, useUserPermissions } from "@/hooks/store";
// plane web imports
import { UpgradeBadge } from "@/plane-web/components/workspace";

export type SidebarWorkspaceMenuItemProps = {
  item: {
    labelTranslationKey: string;
    key: string;
    href: string;
    Icon: any;
    access: EUserWorkspaceRoles[];
  };
};

export const SidebarWorkspaceMenuItem: FC<SidebarWorkspaceMenuItemProps> = observer((props) => {
  const { item } = props;

  const { t } = useTranslation();
  // nextjs hooks
  const pathname = usePathname();
  const { workspaceSlug } = useParams();
  const { allowPermissions } = useUserPermissions();
  // store hooks
  const { toggleSidebar } = useAppTheme();

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  if (!allowPermissions(item.access as any, EUserPermissionsLevel.WORKSPACE, workspaceSlug.toString())) {
    return null;
  }

  const isActive = item.href === pathname;

  return (
    <Link href={item.href} onClick={() => handleLinkClick()}>
      <SidebarNavItem isActive={isActive}>
        <div className="flex items-center gap-1.5 py-[1px]">
          <item.Icon
            className={cn("size-4", {
              "rotate-180": item.key === "active_cycles",
            })}
          />
          <p className="text-sm leading-5 font-medium">{t(item.labelTranslationKey)}</p>
        </div>
        <div className="flex-shrink-0">
          <UpgradeBadge />
        </div>
      </SidebarNavItem>
    </Link>
  );
});
