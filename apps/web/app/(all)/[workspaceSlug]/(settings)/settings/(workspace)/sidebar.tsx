import { useParams, usePathname } from "next/navigation";
import { ArrowUpToLine, Building, CreditCard, Users, Webhook } from "lucide-react";
import {
  EUserPermissionsLevel,
  GROUPED_WORKSPACE_SETTINGS,
  WORKSPACE_SETTINGS_CATEGORIES,
  EUserPermissions,
  WORKSPACE_SETTINGS_CATEGORY,
} from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
import { SettingsSidebar } from "@/components/settings";
import { useUserPermissions } from "@/hooks/store/user";
import { shouldRenderSettingLink } from "@/plane-web/helpers/workspace.helper";

const ICONS = {
  general: Building,
  members: Users,
  export: ArrowUpToLine,
  "billing-and-plans": CreditCard,
  webhooks: Webhook,
};

export const WorkspaceActionIcons = ({
  type,
  size,
  className,
}: {
  type: string;
  size?: number;
  className?: string;
}) => {
  if (type === undefined) return null;
  const Icon = ICONS[type as keyof typeof ICONS];
  if (!Icon) return null;
  return <Icon size={size} className={className} strokeWidth={2} />;
};

type TWorkspaceSettingsSidebarProps = {
  isMobile?: boolean;
};

export const WorkspaceSettingsSidebar = (props: TWorkspaceSettingsSidebarProps) => {
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
};
