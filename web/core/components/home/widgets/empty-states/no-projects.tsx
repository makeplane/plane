import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Briefcase, Check, Hotel, Users, X } from "lucide-react";
// plane ui
import { useLocalStorage } from "@plane/hooks";
import { Avatar } from "@plane/ui";
// helpers
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useCommandPalette, useEventTracker, useProject, useUser, useUserPermissions } from "@/hooks/store";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants";

export const NoProjectsEmptyState = () => {
  // navigation
  const { workspaceSlug } = useParams();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { toggleCreateProjectModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const { data: currentUser } = useUser();
  const { joinedProjectIds } = useProject();
  // local storage
  const { storedValue, setValue } = useLocalStorage(`quickstart-guide-${workspaceSlug}`, {
    hide: false,
    visited_members: false,
    visited_workspace: false,
    visited_profile: false,
  });
  // derived values
  const canCreateProject = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const EMPTY_STATE_DATA = [
    {
      id: "create-project",
      title: "Create a project.",
      description: "Most things start with a project in Plane.",
      icon: <Briefcase className="size-10 text-custom-primary-100" />,
      flag: "projects",
      cta: {
        text: "Get started",
        onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          if (!canCreateProject) return;
          e.preventDefault();
          e.stopPropagation();
          setTrackElement("Sidebar");
          toggleCreateProjectModal(true);
        },
      },
    },
    {
      id: "invite-team",
      title: "Invite your team.",
      description: "Build, ship, and manage with coworkers.",
      icon: <Users className="size-10 text-custom-primary-100" />,
      flag: "visited_members",
      cta: {
        text: "Get them in",
        link: `/${workspaceSlug}/settings/members`,
      },
    },
    {
      id: "configure-workspace",
      title: "Set up your workspace.",
      description: "Turn features on or off or go beyond that.",
      icon: <Hotel className="size-10 text-custom-primary-100" />,
      flag: "visited_workspace",
      cta: {
        text: "Configure this workspace",
        link: "settings",
      },
    },
    {
      id: "personalize-account",
      title: "Make Plane yours.",
      description: "Choose your picture, colors, and more.",
      icon: (
        <Avatar
          src={getFileURL(currentUser?.avatar_url ?? "")}
          name={currentUser?.display_name}
          size={40}
          className="text-xl"
          showTooltip={false}
        />
      ),
      flag: "visited_profile",
      cta: {
        text: "Personalize now",
        link: "/profile",
      },
    },
  ];
  const isComplete = (type: string) => {
    switch (type) {
      case "projects":
        return joinedProjectIds?.length > 0;
      case "visited_members":
        return storedValue?.visited_members;
      case "visited_workspace":
        return storedValue?.visited_workspace;
      case "visited_profile":
        return storedValue?.visited_profile;
    }
  };

  if (storedValue?.hide) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-base font-semibold text-custom-text-350">Your quickstart guide</div>
        <button
          className="text-custom-text-300 font-medium text-sm flex items-center gap-1"
          onClick={() => {
            if (!storedValue) return;
            setValue({ ...storedValue, hide: true });
          }}
        >
          <X className="size-4" />
          Not right now
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {EMPTY_STATE_DATA.map((item) => (
          <div
            key={item.id}
            className="flex flex-col items-center justify-center p-6 bg-custom-background-100 rounded-lg text-center border border-custom-border-200/40"
          >
            <div className="grid place-items-center bg-custom-primary-100/10 rounded-full size-20 mb-3">
              <span className="text-3xl my-auto">{item.icon}</span>
            </div>
            <h3 className="text-base font-medium text-custom-text-100 mb-2">{item.title}</h3>
            <p className="text-sm text-custom-text-300 mb-2">{item.description}</p>
            {isComplete(item.flag) ? (
              <div className="flex items-center gap-2 bg-[#17a34a] rounded-full p-1">
                <Check className="size-3 text-custom-primary-100 text-white" />
              </div>
            ) : item.cta.link ? (
              <Link
                href={item.cta.link}
                onClick={() => {
                  if (!storedValue) return;
                  setValue({
                    ...storedValue,
                    [item.flag]: true,
                  });
                }}
                className="text-custom-primary-100 hover:text-custom-primary-200 text-sm font-medium"
              >
                {item.cta.text}
              </Link>
            ) : (
              <button
                type="button"
                className="text-custom-primary-100 hover:text-custom-primary-200 text-sm font-medium"
                onClick={item.cta.onClick}
              >
                {item.cta.text}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
