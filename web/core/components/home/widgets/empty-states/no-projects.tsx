import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Briefcase, Hotel, Users } from "lucide-react";
// plane ui
import { Avatar } from "@plane/ui";
// helpers
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useCommandPalette, useEventTracker, useUser, useUserPermissions } from "@/hooks/store";
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
      icon: <Briefcase className="size-12 text-custom-primary-100" />,
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
      icon: <Users className="size-12 text-custom-primary-100" />,
      cta: {
        text: "Get them in",
        link: `/${workspaceSlug}/settings/members`,
      },
    },
    {
      id: "configure-workspace",
      title: "Set up your workspace.",
      description: "Turn features on or off or go beyond that.",
      icon: <Hotel className="size-12 text-custom-primary-100" />,
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
          size={48}
          className="text-xl"
          showTooltip={false}
        />
      ),
      cta: {
        text: "Personalize now",
        link: "/profile",
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {EMPTY_STATE_DATA.map((item) => (
        <div
          key={item.id}
          className="flex flex-col items-center justify-center p-6 bg-custom-background-100 rounded-lg text-center border border-custom-border-200/40"
        >
          <div className="grid place-items-center bg-custom-primary-100/10 rounded-full size-24 mb-3">
            <span className="text-3xl my-auto">{item.icon}</span>
          </div>
          <h3 className="text-base font-medium text-custom-text-100 mb-2">{item.title}</h3>
          <p className="text-sm text-custom-text-300 mb-2">{item.description}</p>
          {item.cta.link ? (
            <Link
              href={item.cta.link}
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
  );
};
