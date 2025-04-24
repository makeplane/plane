import { CircleUser, Activity, Bell, CircleUserRound, KeyRound, Settings2, Blocks } from "lucide-react";
import { GROUPED_PROFILE_SETTINGS, PROFILE_SETTINGS_CATEGORIES } from "@plane/constants";
import { SettingsSidebar } from "@/components/settings";
import { getFileURL } from "@/helpers/file.helper";
import { useUser } from "@/hooks/store/user";

type TProfileSidebarProps = {
  workspaceSlug: string;
  pathname: string;
};

export const ProjectActionIcons = ({ type, size, className }: { type: string; size?: number; className?: string }) => {
  const icons = {
    profile: CircleUser,
    security: KeyRound,
    activity: Activity,
    appearance: Settings2,
    notifications: Bell,
    "api-tokens": Blocks,
  };

  if (type === undefined) return null;
  const Icon = icons[type as keyof typeof icons];
  if (!Icon) return null;
  return <Icon size={size} className={className} strokeWidth={2} />;
};

export const ProfileSidebar = (props: TProfileSidebarProps) => {
  const { workspaceSlug, pathname } = props;
  // store hooks
  const { data: currentUser } = useUser();
  return (
    <SettingsSidebar
      categories={PROFILE_SETTINGS_CATEGORIES}
      groupedSettings={GROUPED_PROFILE_SETTINGS}
      workspaceSlug={workspaceSlug.toString()}
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
};
