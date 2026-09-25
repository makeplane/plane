/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { attachInstruction, extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { createRoot } from "react-dom/client";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import {
  ArchiveOutline,
  ChevronRightOutline,
  LinkOutline,
  LogOutOutline,
  MoreHorizontalOutline,
  SettingsOutline,
  ShareAltOutline,
} from "@makeplane/propel/icons";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/blocks/emoji-icon-picker";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { ControlLink } from "@plane/blocks/layout";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { DropIndicator, DragHandle } from "@plane/blocks/common";
import { cn } from "@plane/utils";
// components
import { DEFAULT_TAB_KEY, getTabUrl } from "@/components/navigation/tab-navigation-utils";
import { useTabPreferences } from "@/components/navigation/use-tab-preferences";
import { LeaveProjectModal } from "@/components/project/leave-project-modal";
import { PublishProjectModal } from "@/components/project/publish-project/modal";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useProjectNavigationPreferences } from "@/hooks/use-navigation-preferences";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { HIGHLIGHT_CLASS, highlightIssueOnDrop } from "../../issues/issue-layouts/utils";
import { ProjectNavigation } from "./project-navigation";
import { useNavigationItems } from "@/components/navigation/use-navigation-items";

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

export const SidebarProjectsListItem = observer(function SidebarProjectsListItem(props: Props) {
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
  const { preferences: projectPreferences } = useProjectNavigationPreferences();
  const { isExtendedProjectSidebarOpened, toggleExtendedProjectSidebar, toggleAnySidebarDropdown } = useAppTheme();

  // states
  const [leaveProjectModalOpen, setLeaveProjectModal] = useState(false);
  const [publishModalOpen, setPublishModal] = useState(false);
  const [isMenuActive, setIsMenuActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isProjectListOpen = getIsProjectListOpen(projectId);
  const [instruction, setInstruction] = useState<"DRAG_OVER" | "DRAG_BELOW" | undefined>(undefined);
  // refs
  const projectRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLButtonElement | null>(null);
  // router
  const { workspaceSlug, projectId: URLProjectId } = useParams();
  const router = useRouter();
  // derived values
  const project = getPartialProjectById(projectId);

  // Get available navigation items for this project
  const navigationItems = useNavigationItems({
    workspaceSlug: workspaceSlug.toString(),
    projectId,
    project,
    allowPermissions,
  });
  const availableTabKeys = navigationItems.map((item) => item.key);

  // Get preferences from hook
  const { tabPreferences } = useTabPreferences(workspaceSlug.toString(), projectId);
  const defaultTabKey = tabPreferences.defaultTab;
  // Validate that the default tab is available
  const validatedDefaultTabKey = availableTabKeys.includes(defaultTabKey) ? defaultTabKey : DEFAULT_TAB_KEY;
  const defaultTabUrl = project ? getTabUrl(workspaceSlug.toString(), project.id, validatedDefaultTabKey) : "";

  // toggle project list open
  const setIsProjectListOpen = useCallback(
    (value: boolean) => toggleProjectListOpen(projectId, value),
    [projectId, toggleProjectListOpen]
  );
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
                <div className="flex items-center rounded-sm bg-surface-1 p-1 pr-2 text-13">
                  <div className="grid size-4 flex-shrink-0 place-items-center">
                    {project && <Logo logo={project?.logo_props} />}
                  </div>
                  <p className="truncate text-secondary">{project?.name}</p>
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
        // oxlint-disable-next-line no-shadow
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
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, [projectId, isLastChild, projectListType, handleOnProjectDrop]);

  useEffect(() => {
    if (isMenuActive) toggleAnySidebarDropdown(true);
    else toggleAnySidebarDropdown(false);
  }, [isMenuActive, toggleAnySidebarDropdown]);

  useOutsideClickDetector(projectRef, () => projectRef?.current?.classList?.remove(HIGHLIGHT_CLASS));

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (URLProjectId === project?.id) {
      setIsProjectListOpen(true);
      // Scroll to active project
      if (projectRef.current) {
        timeoutId = setTimeout(() => {
          if (projectRef.current) {
            scrollIntoView(projectRef.current, {
              behavior: "smooth",
              block: "center",
              scrollMode: "if-needed",
            });
          }
        }, 200);
      }
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [URLProjectId, project?.id, setIsProjectListOpen]);

  if (!project) return null;

  const isAccordionMode = projectPreferences.navigationMode === "ACCORDION";

  const handleItemClick = () => {
    if (projectPreferences.navigationMode === "ACCORDION") {
      setIsProjectListOpen(!isProjectListOpen);
    } else {
      router.push(defaultTabUrl);
    }
    // close the extended sidebar if it is open
    if (isExtendedProjectSidebarOpened && !isAccordionMode) {
      toggleExtendedProjectSidebar(false);
    }
  };

  const shouldHighlightProject = URLProjectId === project?.id && projectPreferences.navigationMode !== "ACCORDION";

  return (
    <>
      <PublishProjectModal isOpen={publishModalOpen} projectId={projectId} onClose={() => setPublishModal(false)} />
      <LeaveProjectModal project={project} isOpen={leaveProjectModalOpen} onClose={() => setLeaveProjectModal(false)} />
      <div key={`${project.id}_${URLProjectId}`}>
        <div
          id={`sidebar-${projectId}-${projectListType}`}
          className={cn("relative", {
            "bg-layer-1 opacity-60": isDragging,
          })}
          ref={projectRef}
        >
          <DropIndicator classNames="absolute top-0" isVisible={instruction === "DRAG_OVER"} />
          <div
            className={cn(
              "group/project-item relative flex w-full items-center rounded-md px-2 py-1.5 text-primary hover:bg-layer-transparent-hover",
              {
                "bg-surface-2": isMenuActive,
                "bg-layer-transparent-active": shouldHighlightProject,
              }
            )}
            id={`${project?.id}`}
          >
            {!disableDrag && (
              <Tooltip
                label={project.sort_order === null ? t("join_the_project_to_rearrange") : t("drag_to_rearrange")}
                align="end"
                disabled={isDragging || isMobile}
              >
                <button
                  type="button"
                  className={cn(
                    "absolute top-1/2 -left-3 hidden -translate-y-1/2 cursor-grab items-center justify-center rounded-sm text-placeholder group-hover/project-item:flex",
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
              <ControlLink href={defaultTabUrl} className="flex flex-grow truncate" onClick={handleItemClick}>
                {isAccordionMode ? (
                  <button
                    type="button"
                    className="flex w-full flex-grow items-center gap-1.5 text-left select-none"
                    aria-expanded={isProjectListOpen}
                    aria-label={
                      isProjectListOpen
                        ? t("aria_labels.projects_sidebar.close_project_menu")
                        : t("aria_labels.projects_sidebar.open_project_menu")
                    }
                  >
                    <div className="grid size-4 flex-shrink-0 place-items-center">
                      <Logo logo={project.logo_props} size={16} />
                    </div>
                    <p className="truncate text-13 font-medium text-secondary">{project.name}</p>
                  </button>
                ) : (
                  <div className="flex w-full flex-grow items-center gap-1.5 text-left select-none">
                    <div className="grid size-4 flex-shrink-0 place-items-center">
                      <Logo logo={project.logo_props} size={16} />
                    </div>
                    <p className="truncate text-13 font-medium text-secondary">{project.name}</p>
                  </div>
                )}
              </ControlLink>
              <div className="flex items-center gap-1">
                <div
                  className={cn(
                    "pointer-events-none flex-shrink-0 opacity-0 group-hover/project-item:pointer-events-auto group-hover/project-item:opacity-100",
                    {
                      "pointer-events-auto opacity-100": isMenuActive,
                    }
                  )}
                >
                  <Menu onOpenChange={setIsMenuActive}>
                    <MenuTrigger
                      render={
                        <IconButton
                          variant="ghost"
                          size="xs"
                          icon={<Icon icon={MoreHorizontalOutline} />}
                          aria-label={t("aria_labels.projects_sidebar.toggle_quick_actions_menu")}
                          render={<button type="button" className="text-placeholder" />}
                        />
                      }
                    />
                    <MenuContent side="bottom" align="start">
                      {/* TODO: Removed is_favorite logic due to the optimization in projects API */}
                      {/* publish project settings */}
                      {isAdmin && (
                        <MenuItem
                          icon={<Icon icon={ShareAltOutline} />}
                          label={t("publish_project")}
                          onClick={() => setPublishModal(true)}
                        />
                      )}
                      <MenuItem icon={<Icon icon={LinkOutline} />} label={t("copy_link")} onClick={handleCopyText} />
                      {isAuthorized && (
                        <MenuItem
                          icon={<Icon icon={ArchiveOutline} />}
                          label={t("archives")}
                          onClick={() => {
                            router.push(`/${workspaceSlug}/projects/${project?.id}/archives/issues`);
                          }}
                        />
                      )}
                      <MenuItem
                        icon={<Icon icon={SettingsOutline} />}
                        label={t("settings")}
                        onClick={() => {
                          router.push(`/${workspaceSlug}/settings/projects/${project?.id}`);
                        }}
                      />
                      {/* leave project */}
                      {!isAuthorized && (
                        <MenuItem
                          icon={<Icon icon={LogOutOutline} />}
                          label={t("leave_project")}
                          onClick={handleLeaveProject}
                        />
                      )}
                    </MenuContent>
                  </Menu>
                </div>
                {isAccordionMode && (
                  <span
                    className={cn("hidden text-placeholder group-hover/project-item:inline-flex", {
                      "inline-flex": isMenuActive,
                    })}
                  >
                    <IconButton
                      variant="ghost"
                      size="xs"
                      icon={
                        <ChevronRightOutline
                          className={cn("size-3.5 transition-transform", {
                            "rotate-90": isProjectListOpen,
                          })}
                        />
                      }
                      onClick={() => setIsProjectListOpen(!isProjectListOpen)}
                      aria-expanded={isProjectListOpen}
                      aria-label={t(
                        isProjectListOpen
                          ? "aria_labels.projects_sidebar.close_project_menu"
                          : "aria_labels.projects_sidebar.open_project_menu"
                      )}
                    />
                  </span>
                )}
              </div>
            </>
          </div>
          {isAccordionMode && isProjectListOpen && (
            <div className="relative mt-1 mb-1.5 flex flex-col gap-0.5 pl-6">
              <div className="absolute top-0 bottom-1 left-[15px] w-[1px] bg-layer-3" />
              <ProjectNavigation workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
            </div>
          )}
          {isLastChild && <DropIndicator isVisible={instruction === "DRAG_BELOW"} />}
        </div>
      </div>
    </>
  );
});
