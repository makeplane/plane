import React, { useState } from "react";
import { observer } from "mobx-react";
import { ArchiveRestoreIcon, LinkIcon, Lock, MoreHorizontal, Settings, Trash2 } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useOutsideClickDetector } from "@plane/hooks";
import { EUserProjectRoles, EUserWorkspaceRoles } from "@plane/types";
import {
  ArchiveIcon,
  CustomMenu,
  FavoriteStar,
  setPromiseToast,
  setToast,
  TContextMenuItem,
  TOAST_TYPE,
} from "@plane/ui";
import { cn, copyUrlToClipboard, getFileURL } from "@plane/utils";
// components
import { Logo } from "@/components/common";
// helpers
// hooks
import { useProject, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { TProject } from "@/plane-web/types/projects";

type Props = {
  project: TProject;
  workspaceSlug: string;
  setJoinProjectModal: (value: boolean) => void;
  setArchiveRestoreProject: (value: boolean) => void;
  setDeleteProjectModal: (value: boolean) => void;
};
const Details: React.FC<Props> = observer((props) => {
  const { project, workspaceSlug, setArchiveRestoreProject, setDeleteProjectModal } = props;
  // store hooks
  const { addProjectToFavorites, removeProjectFromFavorites } = useProject();
  const { allowPermissions } = useUserPermissions();
  // router
  const router = useAppRouter();
  // auth
  const isOwner = project.member_role === EUserProjectRoles.ADMIN;
  const isMember = project.member_role === EUserProjectRoles.MEMBER;
  const shouldRenderFavorite = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  // archive
  const isArchived = !!project.archived_at;

  const handleAddToFavorites = () => {
    if (!workspaceSlug) return;

    const addToFavoritePromise = addProjectToFavorites(workspaceSlug.toString(), project.id);
    setPromiseToast(addToFavoritePromise, {
      loading: "Adding project to favorites...",
      success: {
        title: "Success!",
        message: () => "Project added to favorites.",
      },
      error: {
        title: "Error!",
        message: () => "Couldn't add the project to favorites. Please try again.",
      },
    });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug) return;

    const removeFromFavoritePromise = removeProjectFromFavorites(workspaceSlug.toString(), project.id);
    setPromiseToast(removeFromFavoritePromise, {
      loading: "Removing project from favorites...",
      success: {
        title: "Success!",
        message: () => "Project removed from favorites.",
      },
      error: {
        title: "Error!",
        message: () => "Couldn't remove the project from favorites. Please try again.",
      },
    });
  };
  const projectLink = `${workspaceSlug}/projects/${project.id}/issues`;
  const handleCopyText = () =>
    copyUrlToClipboard(projectLink).then(() =>
      setToast({
        type: TOAST_TYPE.INFO,
        title: "Link Copied!",
        message: "Project link copied to clipboard.",
      })
    );

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "copy-link",
      action: handleCopyText,
      title: "Copy link",
      icon: LinkIcon,
      shouldRender: !isArchived,
    },
    {
      key: "restore",
      action: () => setArchiveRestoreProject(true),
      title: "Restore",
      icon: ArchiveRestoreIcon,
      shouldRender: isArchived && isOwner,
    },
    {
      key: "delete",
      action: () => setDeleteProjectModal(true),
      title: "Delete",
      icon: Trash2,
      shouldRender: isArchived && isOwner,
    },
    {
      key: "Archive",
      action: () => setArchiveRestoreProject(true),
      title: "Archive Project",
      icon: ArchiveIcon,
      shouldRender: isOwner && !isArchived,
    },
    {
      key: "settings",
      action: () => router.push(`/${workspaceSlug}/projects/${project.id}/settings`, {}),
      title: "Settings",
      icon: Settings,
      shouldRender: !isArchived && (isOwner || isMember),
    },
  ];

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const ref = React.useRef<HTMLDivElement | null>(null);
  useOutsideClickDetector(ref, () => setIsOpen(false));

  return (
    <div className="w-full rounded-t ">
      <div className="relative ">
        <div>
          <img
            src={getFileURL(
              project.cover_image_url ??
                "https://images.unsplash.com/photo-1672243775941-10d763d9adef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
            )}
            alt={project.name}
            className="relative w-full rounded-t object-cover h-[120px]"
            // ref={projectCardRef}
            draggable={false}
            onDrag={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
          <div
            className={cn(
              "hidden rounded absolute group-hover/project-card:flex inset-0 z-[1] bg-gradient-to-t to-black/60 from-transparent ",
              { "flex ": isOpen }
            )}
          />
        </div>
        <div className="flex gap-2 absolute top-2 right-2" data-prevent-progress>
          {(isOwner || !isArchived) && (
            <CustomMenu
              customButton={
                <span
                  className="grid place-items-center p-0.5 text-white rounded my-auto"
                  ref={ref}
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <MoreHorizontal className="size-4" />
                </span>
              }
              className={cn(
                "flex justify-center items-center opacity-0 z-[10] pointer-events-none flex-shrink-0 group-hover/project-card:opacity-100 group-hover/project-card:pointer-events-auto my-auto bg-white/30 rounded h-6 w-6 ",
                { "opacity-100 pointer-events-auto": isOpen }
              )}
              customButtonClassName="grid place-items-center"
              placement="bottom-start"
              useCaptureForOutsideClick
            >
              {MENU_ITEMS.filter((item) => item.shouldRender).map((item) => (
                <CustomMenu.MenuItem
                  key={item.key}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    item.action();
                  }}
                >
                  <div className="flex items-center justify-start gap-2">
                    {item.icon && (
                      <item.icon className={cn("h-3 w-3", item.iconClassName)} iconClassName={item.iconClassName} />
                    )}
                    <span>{item.title}</span>
                  </div>
                </CustomMenu.MenuItem>
              ))}
            </CustomMenu>
          )}

          {!!project.member_role && !isArchived && shouldRenderFavorite && (
            <div data-prevent-progress>
              {" "}
              <FavoriteStar
                buttonClassName={cn(
                  "relative flex justify-center items-center opacity-0 z-[2] pointer-events-none flex-shrink-0 group-hover/project-card:opacity-100 group-hover/project-card:pointer-events-auto my-auto bg-white/30 rounded h-6 w-6",
                  {
                    "opacity-100 pointer-events-auto": project.is_favorite || isOpen,
                  }
                )}
                iconClassName="text-white"
                onClick={(e) => {
                  if (isArchived) return;
                  e.preventDefault();
                  e.stopPropagation();
                  if (project.is_favorite) handleRemoveFromFavorites();
                  else handleAddToFavorites();
                }}
                selected={!!project.is_favorite}
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex h-10 w-full items-center justify-between gap-3 mt-3 p-4">
        <div className="flex flex-grow items-center gap-2.5 truncate">
          <div className="h-9 w-9 flex-shrink-0 grid place-items-center rounded bg-custom-background-90">
            <Logo logo={project.logo_props} size={18} />
          </div>

          <div className="flex w-full flex-col justify-between gap-0.5 truncate">
            <div className="flex justify-between ">
              <h3 className=" font-medium w-full truncate ">{project.name}</h3>
            </div>
            <span className="flex items-center gap-1.5">
              <p className="text-xs font-medium ">{project.identifier} </p>
              {project.network === 0 && <Lock className="h-2.5 w-2.5  " />}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
export default Details;
