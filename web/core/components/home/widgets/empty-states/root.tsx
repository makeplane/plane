import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Briefcase, Hotel, Users } from "lucide-react";
// helpers
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useCommandPalette, useEventTracker, useUser, useUserPermissions } from "@/hooks/store";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants";

export const EmptyWorkspace = () => {
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
      title: "Create a project",
      description: "Create your first project now to get started",
      icon: <Briefcase className="w-[40px] h-[40px] text-custom-primary-100" />,
      cta: {
        text: "Create Project",
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
      title: "Invite your team",
      description: "The sub text will be of two lines and that will be placed.",
      icon: <Users className="w-[40px] h-[40px] text-custom-primary-100" />,
      cta: {
        text: "Invite now",
        link: `/${workspaceSlug}/settings/members`,
      },
    },
    {
      id: "configure-workspace",
      title: "Configure your workspace",
      description: "The sub text will be of two lines and that will be placed.",
      icon: <Hotel className="w-[40px] h-[40px] text-custom-primary-100" />,
      cta: {
        text: "Configure workspace",
        link: "settings",
      },
    },
    {
      id: "personalize-account",
      title: "Personalize your account",
      description: "The sub text will be of two lines and that will be placed.",
      icon:
        currentUser?.avatar_url && currentUser?.avatar_url.trim() !== "" ? (
          <Link href={`/${workspaceSlug}/profile/${currentUser?.id}`}>
            <span className="relative flex h-6 w-6 items-center justify-center rounded-full p-4 capitalize text-white">
              <img
                src={getFileURL(currentUser?.avatar_url)}
                className="absolute left-0 top-0 h-full w-full rounded-full object-cover"
                alt={currentUser?.display_name || currentUser?.email}
              />
            </span>
          </Link>
        ) : (
          <Link href={`/${workspaceSlug}/profile/${currentUser?.id}`}>
            <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 p-4 capitalize text-white text-sm">
              {(currentUser?.email ?? currentUser?.display_name ?? "?")[0]}
            </span>
          </Link>
        ),
      cta: {
        text: "Personalize account",
        link: "/profile",
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {EMPTY_STATE_DATA.map((item) => (
        <div
          key={item.id}
          className="flex flex-col items-center justify-center py-8 bg-custom-background-100 rounded-lg text-center border border-custom-border-200/40"
        >
          <div className="flex items-center justify-center bg-custom-primary-100/10 rounded-full w-[80px] h-[80px] mb-4">
            <span className="text-3xl my-auto">{item.icon}</span>
          </div>
          <h3 className="text-lg font-medium text-custom-text-100 mb-2">{item.title}</h3>
          <p className="text-sm text-custom-text-200 mb-4 w-[80%] flex-1">{item.description}</p>

          {item.cta.link ? (
            <Link
              href={item.cta.link}
              className="text-custom-primary-100 hover:text-custom-primary-200 text-sm font-medium"
            >
              {item.cta.text}
            </Link>
          ) : (
            <button
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
