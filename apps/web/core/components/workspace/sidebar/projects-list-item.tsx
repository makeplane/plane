"use client";

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { attachInstruction, extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { createRoot } from "react-dom/client";
import { LinkIcon, Settings, Share2, LogOut, MoreHorizontal, ChevronRight } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// plane helpers
import { EUserPermissions, EUserPermissionsLevel, MEMBER_TRACKER_ELEMENTS } from "@plane/constants";
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
// ui
import { CustomMenu, Tooltip, ArchiveIcon, DropIndicator, DragHandle, ControlLink } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { Logo } from "@/components/common/logo";
import { LeaveProjectModal, PublishProjectModal } from "@/components/project";
// helpers
// hooks
import { useAppTheme, useCommandPalette, useProject, useUserPermissions } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane-web components
import { ProjectNavigationRoot } from "@/plane-web/components/sidebar";
// constants
import { HIGHLIGHT_CLASS, highlightIssueOnDrop } from "../../issues/issue-layouts/utils";

type Props = {
  projectId: string;
  handleCopyText: () => void;
  handleOnProjectDrop?: (
    sourceId: string | undefined,
    destinationId: string | undefined,
    shouldDropAtEnd: boolean
  ) => void;
  projectListType: "JOINED" | "FAVORITES";
  disableDrag?: boolean;
  disableDrop?: boolean;
  isLastChild: boolean;
  renderInExtendedSidebar?: boolean;
};

export const SidebarProjectsListItem: React.FC<Props> = observer((props) => {
  const {
    projectId,
    handleCopyText,
    disableDrag,
    disableDrop,
    isLastChild,
    handleOnProjectDrop,
    projectListType,
    renderInExtendedSidebar = false,
  } = props;
  // store hooks
  const { t } = useTranslation();
  const { getPartialProjectById } = useProject();
  const { isMobile } = usePlatformOS();
  const { allowPermissions } = useUserPermissions();
  const { getIsProjectListOpen, toggleProjectListOpen } = useCommandPalette();
  const { toggleAnySidebarDropdown } = useAppTheme();

  // states
  const [leaveProjectModalOpen, setLeaveProjectModal] = useState(false);
  const [publishModalOpen, setPublishModal] = useState(false);
  const [isMenuActive, setIsMenuActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isProjectListOpen = getIsProjectListOpen(projectId);
  const [instruction, setInstruction] = useState<"DRAG_OVER" | "DRAG_BELOW" | undefined>(undefined);
  // refs
  const actionSectionRef = useRef<HTMLDivElement | null>(null);
  const projectRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLButtonElement | null>(null);
  // router
  const { workspaceSlug, projectId: URLProjectId } = useParams();
  const router = useRouter();
  // derived values
  const project = getPartialProjectById(projectId);
  // toggle project list open
  const setIsProjectListOpen = (value: boolean) => toggleProjectListOpen(projectId, value);
  // auth
  const isAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    project?.id
  );
  const isAuthorized = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    project?.id
  );

  const handleLeaveProject = () => {
    setLeaveProjectModal(true);
  };

  useEffect(() => {
    const element = projectRef.current;
    const dragHandleElement = dragHandleRef.current;

    if (!element) return;

    return combine(
      draggable({
        element,
        canDrag: () => !disableDrag,
        dragHandle: dragHandleElement ?? undefined,
        getInitialData: () => ({ id: projectId, dragInstanceId: "PROJECTS" }),
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          // Add a custom drag image
          setCustomNativeDragPreview({
            getOffset: pointerOutsideOfPreview({ x: "0px", y: "0px" }),
            render: ({ container }) => {
              const root = createRoot(container);
              root.render(
                <div className="rounded flex items-center bg-custom-background-100 text-sm p-1 pr-2">
                  <div className="size-4 grid place-items-center flex-shrink-0">
                    {project && <Logo logo={project?.logo_props} />}
                  </div>
                  <p className="truncate text-custom-sidebar-text-200">{project?.name}</p>
                </div>
              );
              return () => root.unmount();
            },
            nativeSetDragImage,
          });
        },
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) =>
          !disableDrop && source?.data?.id !== projectId && source?.data?.dragInstanceId === "PROJECTS",
        getData: ({ input, element }) => {
          const data = { id: projectId };

          // attach instruction for last in list
          return attachInstruction(data, {
            input,
            element,
            currentLevel: 0,
            indentPerLevel: 0,
            mode: isLastChild ? "last-in-group" : "standard",
          });
        },
        onDrag: ({ self }) => {
          const extractedInstruction = extractInstruction(self?.data)?.type;
          // check if the highlight is to be shown above or below
          setInstruction(
            extractedInstruction
              ? extractedInstruction === "reorder-below" && isLastChild
                ? "DRAG_BELOW"
                : "DRAG_OVER"
              : undefined
          );
        },
        onDragLeave: () => {
          setInstruction(undefined);
        },
        onDrop: ({ self, source }) => {
          setInstruction(undefined);
          const extractedInstruction = extractInstruction(self?.data)?.type;
          const currentInstruction = extractedInstruction
            ? extractedInstruction === "reorder-below" && isLastChild
              ? "DRAG_BELOW"
              : "DRAG_OVER"
            : undefined;
          if (!currentInstruction) return;

          const sourceId = source?.data?.id as string | undefined;
          const destinationId = self?.data?.id as string | undefined;

          handleOnProjectDrop?.(sourceId, destinationId, currentInstruction === "DRAG_BELOW");

          highlightIssueOnDrop(`sidebar-${sourceId}-${projectListType}`);
        },
      })
    );
  }, [projectId, isLastChild, projectListType, handleOnProjectDrop]);

  useEffect(() => {
    if (isMenuActive) toggleAnySidebarDropdown(true);
    else toggleAnySidebarDropdown(false);
  }, [isMenuActive]);

  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));
  useOutsideClickDetector(projectRef, () => projectRef?.current?.classList?.remove(HIGHLIGHT_CLASS));

  if (!project) return null;

  useEffect(() => {
    if (URLProjectId === project.id) setIsProjectListOpen(true);
  }, [URLProjectId]);

  const handleItemClick = () => setIsProjectListOpen(!isProjectListOpen);
  return (
    <>
      <PublishProjectModal isOpen={publishModalOpen} projectId={projectId} onClose={() => setPublishModal(false)} />
      <LeaveProjectModal project={project} isOpen={leaveProjectModalOpen} onClose={() => setLeaveProjectModal(false)} />
      <Disclosure key={`${project.id}_${URLProjectId}`} defaultOpen={isProjectListOpen} as="div">
        <div
          id={`sidebar-${projectId}-${projectListType}`}
          className={cn("relative", {
            "bg-custom-sidebar-background-80 opacity-60": isDragging,
          })}
          ref={projectRef}
        >
          <DropIndicator classNames="absolute top-0" isVisible={instruction === "DRAG_OVER"} />
          <div
            className={cn(
              "group/project-item relative w-full px-2 py-1.5 flex items-center rounded-md text-custom-sidebar-text-100 hover:bg-custom-sidebar-background-90",
              {
                "bg-custom-sidebar-background-90": isMenuActive,
              }
            )}
            id={`${project?.id}`}
          >
            {!disableDrag && (
              <Tooltip
                isMobile={isMobile}
                tooltipContent={
                  project.sort_order === null ? t("join_the_project_to_rearrange") : t("drag_to_rearrange")
                }
                position="top-right"
                disabled={isDragging}
              >
                <button
                  type="button"
                  className={cn(
                    "hidden group-hover/project-item:flex items-center justify-center absolute top-1/2 -left-3 -translate-y-1/2 rounded text-custom-sidebar-text-400 cursor-grab",
                    {
                      "cursor-not-allowed opacity-60": project.sort_order === null,
                      "cursor-grabbing": isDragging,
                      flex: isMenuActive || renderInExtendedSidebar,
                    }
                  )}
                  ref={dragHandleRef}
                >
                  <DragHandle className="bg-transparent" />
                </button>
              </Tooltip>
            )}
            <>
              <ControlLink
                href={`/${workspaceSlug}/projects/${project.id}/issues`}
                className="flex-grow flex truncate"
                onClick={handleItemClick}
              >
                <Disclosure.Button
                  as="button"
                  type="button"
                  className={cn("flex-grow flex items-center gap-1.5 text-left select-none w-full", {})}
                  aria-label={
                    isProjectListOpen
                      ? t("aria_labels.projects_sidebar.close_project_menu")
                      : t("aria_labels.projects_sidebar.open_project_menu")
                  }
                >
                  <div className="size-4 grid place-items-center flex-shrink-0">
                    <Logo logo={project.logo_props} size={16} />
                  </div>
                  <p className="truncate text-sm font-medium text-custom-sidebar-text-200">{project.name}</p>
                </Disclosure.Button>
              </ControlLink>
              <CustomMenu
                customButton={
                  <span
                    ref={actionSectionRef}
                    className="grid place-items-center p-0.5 text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-80 rounded"
                    onClick={() => setIsMenuActive(!isMenuActive)}
                  >
                    <MoreHorizontal className="size-4" />
                  </span>
                }
                className={cn(
                  "opacity-0 pointer-events-none flex-shrink-0 group-hover/project-item:opacity-100 group-hover/project-item:pointer-events-auto",
                  {
                    "opacity-100 pointer-events-auto": isMenuActive,
                  }
                )}
                customButtonClassName="grid place-items-center"
                placement="bottom-start"
                ariaLabel={t("aria_labels.projects_sidebar.toggle_quick_actions_menu")}
                useCaptureForOutsideClick
                closeOnSelect
                onMenuClose={() => setIsMenuActive(false)}
              >
                {/* TODO: Removed is_favorite logic due to the optimization in projects API */}
                {/* {isAuthorized && (
                    <CustomMenu.MenuItem
                      onClick={project.is_favorite ? handleRemoveFromFavorites : handleAddToFavorites}
                    >
                      <span className="flex items-center justify-start gap-2">
                        <Star
                          className={cn("h-3.5 w-3.5 ", {
                            "fill-yellow-500 stroke-yellow-500": project.is_favorite,
                          })}
                        />
                        <span>{project.is_favorite ? t("remove_from_favorites") : t("add_to_favorites")}</span>
                      </span>
                    </CustomMenu.MenuItem>
                  )} */}

                {/* publish project settings */}
                {isAdmin && (
                  <CustomMenu.MenuItem onClick={() => setPublishModal(true)}>
                    <div className="relative flex flex-shrink-0 items-center justify-start gap-2">
                      <div className="flex h-4 w-4 cursor-pointer items-center justify-center rounded text-custom-sidebar-text-200 transition-all duration-300 hover:bg-custom-sidebar-background-80">
                        <Share2 className="h-3.5 w-3.5 stroke-[1.5]" />
                      </div>
                      <div>{t("publish_project")}</div>
                    </div>
                  </CustomMenu.MenuItem>
                )}
                <CustomMenu.MenuItem onClick={handleCopyText}>
                  <span className="flex items-center justify-start gap-2">
                    <LinkIcon className="h-3.5 w-3.5 stroke-[1.5]" />
                    <span>{t("copy_link")}</span>
                  </span>
                </CustomMenu.MenuItem>
                {isAuthorized && (
                  <CustomMenu.MenuItem
                    onClick={() => {
                      router.push(`/${workspaceSlug}/projects/${project?.id}/archives/issues`);
                    }}
                  >
                    <div className="flex items-center justify-start gap-2 cursor-pointer">
                      <ArchiveIcon className="h-3.5 w-3.5 stroke-[1.5]" />
                      <span>{t("archives")}</span>
                    </div>
                  </CustomMenu.MenuItem>
                )}
                <CustomMenu.MenuItem
                  onClick={() => {
                    router.push(`/${workspaceSlug}/settings/projects/${project?.id}`);
                  }}
                >
                  <div className="flex items-center justify-start gap-2 cursor-pointer">
                    <Settings className="h-3.5 w-3.5 stroke-[1.5]" />
                    <span>{t("settings")}</span>
                  </div>
                </CustomMenu.MenuItem>
                {/* leave project */}
                {!isAuthorized && (
                  <CustomMenu.MenuItem
                    onClick={handleLeaveProject}
                    data-ph-element={MEMBER_TRACKER_ELEMENTS.SIDEBAR_PROJECT_QUICK_ACTIONS}
                  >
                    <div className="flex items-center justify-start gap-2">
                      <LogOut className="h-3.5 w-3.5 stroke-[1.5]" />
                      <span>{t("leave_project")}</span>
                    </div>
                  </CustomMenu.MenuItem>
                )}
              </CustomMenu>
              <Disclosure.Button
                as="button"
                type="button"
                className={cn(
                  "hidden group-hover/project-item:inline-block p-0.5 rounded hover:bg-custom-sidebar-background-80",
                  {
                    "inline-block": isMenuActive,
                  }
                )}
                onClick={() => setIsProjectListOpen(!isProjectListOpen)}
                aria-label={t(
                  isProjectListOpen
                    ? "aria_labels.projects_sidebar.close_project_menu"
                    : "aria_labels.projects_sidebar.open_project_menu"
                )}
              >
                <ChevronRight
                  className={cn("size-4 flex-shrink-0 text-custom-sidebar-text-400 transition-transform", {
                    "rotate-90": isProjectListOpen,
                  })}
                />
              </Disclosure.Button>
            </>
          </div>
          <Transition
            show={isProjectListOpen}
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            {isProjectListOpen && (
              <Disclosure.Panel as="div" className="flex flex-col gap-0.5 mt-1">
                <ProjectNavigationRoot workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
              </Disclosure.Panel>
            )}
          </Transition>
          {isLastChild && <DropIndicator isVisible={instruction === "DRAG_BELOW"} />}
        </div>
      </Disclosure>
    </>
  );
});
