import React from "react";
// mobx
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Briefcase, Check, Hotel, Users, X } from "lucide-react";
// plane ui
import { EUserPermissions, EUserPermissionsLevel, PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { cn, getFileURL } from "@plane/utils";
// helpers
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useCommandPalette, useProject, useUser, useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web constants

export const NoProjectsEmptyState = observer(() => {
  // navigation
  const { workspaceSlug } = useParams();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { toggleCreateProjectModal } = useCommandPalette();
  const { data: currentUser } = useUser();
  const { joinedProjectIds } = useProject();
  const { currentWorkspace: activeWorkspace } = useWorkspace();
  // local storage
  const { storedValue, setValue } = useLocalStorage(`quickstart-guide-${workspaceSlug}`, {
    hide: false,
    visited_members: false,
    visited_workspace: false,
    visited_profile: false,
  });
  const { t } = useTranslation();
  // derived values
  const canCreateProject = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const isWorkspaceAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const EMPTY_STATE_DATA = [
    {
      id: "create-project",
      title: "home.empty.create_project.title",
      description: "home.empty.create_project.description",
      icon: <Briefcase className="size-4" />,
      flag: "projects",
      cta: {
        text: "home.empty.create_project.cta",
        onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          if (!canCreateProject) return;
          e.preventDefault();
          e.stopPropagation();
          toggleCreateProjectModal(true);
          captureClick({ elementName: PROJECT_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_PROJECT_BUTTON });
        },
        disabled: !canCreateProject,
      },
    },
    {
      id: "invite-team",
      title: "home.empty.invite_team.title",
      description: "home.empty.invite_team.description",
      icon: <Users className="size-4" />,
      flag: "visited_members",
      cta: {
        text: "home.empty.invite_team.cta",
        link: `/${workspaceSlug}/settings/members`,
        disabled: !isWorkspaceAdmin,
      },
    },
    {
      id: "configure-workspace",
      title: "home.empty.configure_workspace.title",
      description: "home.empty.configure_workspace.description",
      icon: <Hotel className="size-4" />,
      flag: "visited_workspace",
      cta: {
        text: "home.empty.configure_workspace.cta",
        link: "settings",
        disabled: !isWorkspaceAdmin,
      },
    },
    {
      id: "personalize-account",
      title: "home.empty.personalize_account.title",
      description: "home.empty.personalize_account.description",
      icon:
        currentUser?.avatar_url && currentUser?.avatar_url.trim() !== "" ? (
          <Link href={`/${workspaceSlug}/profile/${currentUser?.id}`}>
            <span className="relative flex size-4 items-center justify-center rounded-full p-4 capitalize text-white">
              <img
                src={getFileURL(currentUser?.avatar_url)}
                className="absolute left-0 top-0 h-full w-full rounded-full object-cover"
                alt={currentUser?.display_name || currentUser?.email}
              />
            </span>
          </Link>
        ) : (
          <Link href={`/${workspaceSlug}/profile/${currentUser?.id}`}>
            <span className="relative flex size-4 items-center justify-center rounded-full bg-gray-700 p-4 capitalize text-white text-sm">
              {(currentUser?.email ?? currentUser?.display_name ?? "?")[0]}
            </span>
          </Link>
        ),
      flag: "visited_profile",
      cta: {
        text: "home.empty.personalize_account.cta",
        link: `/${workspaceSlug}/settings/account`,
        disabled: false,
      },
    },
  ];
  const isComplete = (type: string) => {
    switch (type) {
      case "projects":
        return joinedProjectIds?.length > 0;
      case "visited_members":
        return (activeWorkspace?.total_members || 0) >= 2;
      case "visited_workspace":
        return storedValue?.visited_workspace;
      case "visited_profile":
        return storedValue?.visited_profile;
    }
  };

  if (storedValue?.hide || (joinedProjectIds?.length > 0 && (activeWorkspace?.total_members || 0) >= 2)) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-base font-semibold text-custom-text-350">{t("home.empty.quickstart_guide")}</div>
        <button
          className="text-custom-text-300 font-medium text-sm flex items-center gap-1"
          onClick={() => {
            if (!storedValue) return;
            setValue({ ...storedValue, hide: true });
          }}
        >
          <X className="size-4" />
          {t("home.empty.not_right_now")}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EMPTY_STATE_DATA.map((item) => {
          const isStateComplete = isComplete(item.flag);
          return (
            <div
              key={item.id}
              className="flex flex-col p-4 bg-custom-background-100 rounded-xl border border-custom-border-200/40"
            >
              <div
                className={cn(
                  "grid place-items-center bg-custom-background-90 rounded-full size-9 mb-3 text-custom-text-400",
                  {
                    "text-custom-primary-100 bg-custom-primary-100/10": !isStateComplete,
                  }
                )}
              >
                <span className="text-3xl my-auto">{item.icon}</span>
              </div>
              <h3 className="text-sm font-medium text-custom-text-100 mb-2">{t(item.title)}</h3>
              <p className="text-[11px] text-custom-text-300 mb-2">{t(item.description)}</p>
              {isStateComplete ? (
                <div className="flex items-center gap-2 bg-[#17a34a] rounded-full p-1 w-fit">
                  <Check className="size-3 text-custom-primary-100 text-white" />
                </div>
              ) : (
                !item.cta.disabled &&
                (item.cta.link ? (
                  <Link
                    href={item.cta.link}
                    onClick={(e) => {
                      if (!storedValue) {
                        e.stopPropagation();
                        e.preventDefault();
                        return;
                      }
                      setValue({
                        ...storedValue,
                        [item.flag]: true,
                      });
                    }}
                    className={cn("text-custom-primary-100 hover:text-custom-primary-200 text-sm font-medium", {})}
                  >
                    {t(item.cta.text)}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="text-custom-primary-100 hover:text-custom-primary-200 text-sm font-medium"
                    onClick={item.cta.onClick}
                  >
                    {t(item.cta.text)}
                  </button>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
