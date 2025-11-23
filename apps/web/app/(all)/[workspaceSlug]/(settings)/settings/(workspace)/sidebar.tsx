import { useParams, usePathname } from "next/navigation";
import { ArrowUpToLine, Building, CreditCard, Users, Webhook } from "lucide-react";
import type { LucideIcon } from "lucide-react";
// plane imports
import {
  EUserPermissionsLevel,
  EUserPermissions,
  GROUPED_WORKSPACE_SETTINGS,
  WORKSPACE_SETTINGS_CATEGORIES,
  WORKSPACE_SETTINGS_CATEGORY,
} from "@plane/constants";
import type { WORKSPACE_SETTINGS } from "@plane/constants";
import type { ISvgIcons } from "@plane/propel/icons";
import type { EUserWorkspaceRoles } from "@plane/types";
// components
import { SettingsSidebar } from "@/components/settings/sidebar";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { shouldRenderSettingLink } from "@/plane-web/helpers/workspace.helper";

export const WORKSPACE_SETTINGS_ICONS: Record<keyof typeof WORKSPACE_SETTINGS, LucideIcon | React.FC<ISvgIcons>> = {
  general: Building,
  members: Users,
  export: ArrowUpToLine,
  "billing-and-plans": CreditCard,
  webhooks: Webhook,
};

export function WorkspaceActionIcons({ type, size, className }: { type: string; size?: number; className?: string }) {
  if (type === undefined) return null;
  const Icon = WORKSPACE_SETTINGS_ICONS[type as keyof typeof WORKSPACE_SETTINGS_ICONS];
  if (!Icon) return null;
  return <Icon size={size} className={className} strokeWidth={2} />;
}

type TWorkspaceSettingsSidebarProps = {
  isMobile?: boolean;
};

export function WorkspaceSettingsSidebar(props: TWorkspaceSettingsSidebarProps) {
  const { isMobile = false } = props;
  // router
  const pathname = usePathname();
  const { workspaceSlug } = useParams(); // store hooks
  const { allowPermissions } = useUserPermissions();
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  return (
    <SettingsSidebar
      isMobile={isMobile}
      categories={WORKSPACE_SETTINGS_CATEGORIES.filter(
        (category) =>
          isAdmin || ![WORKSPACE_SETTINGS_CATEGORY.FEATURES, WORKSPACE_SETTINGS_CATEGORY.DEVELOPER].includes(category)
      )}
      groupedSettings={GROUPED_WORKSPACE_SETTINGS}
      workspaceSlug={workspaceSlug.toString()}
      isActive={(data: { href: string }) =>
        data.href === "/settings"
          ? pathname === `/${workspaceSlug}${data.href}/`
          : new RegExp(`^/${workspaceSlug}${data.href}/`).test(pathname)
      }
      shouldRender={(data: { key: string; access?: EUserWorkspaceRoles[] | undefined }) =>
        data.access
          ? shouldRenderSettingLink(workspaceSlug.toString(), data.key) &&
            allowPermissions(data.access, EUserPermissionsLevel.WORKSPACE, workspaceSlug.toString())
          : false
      }
      actionIcons={WorkspaceActionIcons}
    />
  );
}
