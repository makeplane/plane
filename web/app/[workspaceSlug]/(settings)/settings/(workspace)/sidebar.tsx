import { ArrowUpToLine, Building, CreditCard, Users, Webhook } from "lucide-react";
import {
  EUserPermissionsLevel,
  GROUPED_WORKSPACE_SETTINGS,
  WORKSPACE_SETTINGS_CATEGORIES,
  EUserWorkspaceRoles,
} from "@plane/constants";
import { SettingsSidebar } from "@/components/settings";
import { useUserPermissions } from "@/hooks/store/user";
import { shouldRenderSettingLink } from "@/plane-web/helpers/workspace.helper";

type TWorkspaceSettingsSidebarProps = {
  workspaceSlug: string;
  pathname: string;
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
  const icons = {
    general: Building,
    members: Users,
    export: ArrowUpToLine,
    "billing-and-plans": CreditCard,
    webhooks: Webhook,
  };

  if (type === undefined) return null;
  const Icon = icons[type as keyof typeof icons];
  if (!Icon) return null;
  return <Icon size={size} className={className} strokeWidth={2} />;
};

export const WorkspaceSettingsSidebar = (props: TWorkspaceSettingsSidebarProps) => {
  const { workspaceSlug, pathname } = props;
  // store hooks
  const { allowPermissions } = useUserPermissions();
  return (
    <SettingsSidebar
      categories={WORKSPACE_SETTINGS_CATEGORIES}
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
