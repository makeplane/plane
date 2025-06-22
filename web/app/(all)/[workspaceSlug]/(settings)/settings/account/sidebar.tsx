import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { CircleUser, Activity, Bell, CircleUserRound, KeyRound, Settings2, Blocks, Lock } from "lucide-react";
// plane imports
import { GROUPED_PROFILE_SETTINGS, PROFILE_SETTINGS_CATEGORIES } from "@plane/constants";
import { getFileURL } from "@plane/utils";
// components
import { SettingsSidebar } from "@/components/settings";
// hooks
import { useUser } from "@/hooks/store/user";

const ICONS = {
  profile: CircleUser,
  security: Lock,
  activity: Activity,
  preferences: Settings2,
  notifications: Bell,
  "api-tokens": KeyRound,
  connections: Blocks,
};

export const ProjectActionIcons = ({ type, size, className }: { type: string; size?: number; className?: string }) => {
  if (type === undefined) return null;
  const Icon = ICONS[type as keyof typeof ICONS];
  if (!Icon) return null;
  return <Icon size={size} className={className} strokeWidth={2} />;
};

type TProfileSidebarProps = {
  isMobile?: boolean;
};

export const ProfileSidebar = observer((props: TProfileSidebarProps) => {
  const { isMobile = false } = props;
  // router
  const pathname = usePathname();
  const { workspaceSlug } = useParams();
  // store hooks
  const { data: currentUser } = useUser();

  return (
    <SettingsSidebar
      isMobile={isMobile}
      categories={PROFILE_SETTINGS_CATEGORIES}
      groupedSettings={GROUPED_PROFILE_SETTINGS}
      workspaceSlug={workspaceSlug?.toString() ?? ""}
      isActive={(data: { href: string }) => pathname === `/${workspaceSlug}${data.href}/`}
      customHeader={
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0">
            {!currentUser?.avatar_url || currentUser?.avatar_url === "" ? (
              <div className="h-8 w-8 rounded-full">
                <CircleUserRound className="h-full w-full text-custom-text-200" />
              </div>
            ) : (
              <div className="relative h-8 w-8 overflow-hidden">
                <img
                  src={getFileURL(currentUser?.avatar_url)}
                  className="absolute left-0 top-0 h-full w-full rounded-lg object-cover"
                  alt={currentUser?.display_name}
                />
              </div>
            )}
          </div>
          <div className="w-full overflow-hidden">
            <div className="text-base font-medium text-custom-text-200 truncate">{currentUser?.display_name}</div>
            <div className="text-sm text-custom-text-300 truncate">{currentUser?.email}</div>
          </div>
        </div>
      }
      actionIcons={ProjectActionIcons}
      shouldRender
    />
  );
});
