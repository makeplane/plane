import React from "react";
// mobx
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Hotel } from "lucide-react";
// plane ui
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { MembersPropertyIcon, CheckIcon, ProjectIcon, CloseIcon } from "@plane/propel/icons";
import { cn, getFileURL } from "@plane/utils";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser, useUserPermissions } from "@/hooks/store/user";
// plane web constants

export const NoProjectsEmptyState = observer(function NoProjectsEmptyState() {
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
      icon: <ProjectIcon className="size-4" />,
      flag: "projects",
      cta: {
        text: "home.empty.create_project.cta",
        onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          if (!canCreateProject) return;
          e.preventDefault();
          e.stopPropagation();
          toggleCreateProjectModal(true);
        },
        disabled: !canCreateProject,
      },
    },
    {
      id: "invite-team",
      title: "home.empty.invite_team.title",
      description: "home.empty.invite_team.description",
      icon: <MembersPropertyIcon className="size-4" />,
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
            <span className="relative flex size-4 items-center justify-center rounded-full p-4 capitalize text-on-color">
              <img
                src={getFileURL(currentUser?.avatar_url)}
                className="absolute left-0 top-0 h-full w-full rounded-full object-cover"
                alt={currentUser?.display_name || currentUser?.email}
              />
            </span>
          </Link>
        ) : (
          <Link href={`/${workspaceSlug}/profile/${currentUser?.id}`}>
            <span className="relative flex size-4 items-center justify-center rounded-full bg-[#028375] p-4 capitalize text-on-color text-13">
              {(currentUser?.email ?? currentUser?.display_name ?? "?")[0]}
            </span>
          </Link>
        ),
      flag: "visited_profile",
      cta: {
        text: "home.empty.personalize_account.cta",
        link: `/settings/profile/general`,
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
        <div className="text-14 font-semibold text-tertiary">{t("home.empty.quickstart_guide")}</div>
        <button
          className="text-tertiary font-medium text-13 flex items-center gap-1"
          onClick={() => {
            if (!storedValue) return;
            setValue({ ...storedValue, hide: true });
          }}
        >
          <CloseIcon className="size-4" />
          {t("home.empty.not_right_now")}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EMPTY_STATE_DATA.map((item) => {
          const isStateComplete = isComplete(item.flag);
          return (
            <div key={item.id} className="flex flex-col p-4 bg-layer-2 rounded-xl border border-subtle">
              <div
                className={cn("grid place-items-center bg-surface-2 rounded-full size-9 mb-3 text-placeholder", {
                  "text-accent-primary bg-accent-primary/10": !isStateComplete,
                })}
              >
                <span className="text-24 my-auto">{item.icon}</span>
              </div>
              <h3 className="text-13 font-medium text-primary mb-2">{t(item.title)}</h3>
              <p className="text-11 text-tertiary mb-2">{t(item.description)}</p>
              {isStateComplete ? (
                <div className="flex items-center gap-2 bg-[#17a34a] rounded-full p-1 w-fit">
                  <CheckIcon className="size-3 text-accent-primary text-on-color" />
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
                    className={cn("text-accent-primary hover:text-accent-secondary text-13 font-medium", {})}
                  >
                    {t(item.cta.text)}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="text-accent-primary hover:text-accent-secondary text-13 font-medium text-left"
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
