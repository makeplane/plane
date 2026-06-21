/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachInstruction, extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { MoreHorizontal, Settings } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ChevronRightIcon, PlusIcon } from "@plane/propel/icons";
import { IconButton } from "@plane/propel/icon-button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { CustomMenu, DragHandle, DropIndicator } from "@plane/ui";
import { cn } from "@plane/utils";
import { SidebarNavItem } from "@/components/sidebar/sidebar-navigation";
import { SprintAutomationModal } from "@/components/workspace/sprints/automation-modal";
import { useWorkspaceSprint } from "@/hooks/store/use-workspace-sprint";
import { useUserPermissions } from "@/hooks/store/user";
import { useSprintNavigationPreferences } from "@/hooks/use-navigation-preferences";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { getSidebarNavigationItemIcon } from "@/plane-web/components/workspace/sidebar/helper";
import type { TSprintNavigationMode } from "@plane/types";

const SPRINT_SIDEBAR_ICON_KEYS = {
  squad: "squad",
  sprint: "sprint",
} as const;

export const SidebarSprintsList = observer(function SidebarSprintsList() {
  const [isOpen, setIsOpen] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { allowPermissions } = useUserPermissions();
  const { preferences: sprintPreferences } = useSprintNavigationPreferences();
  const {
    automationFetchedMap,
    currentWorkspaceSprintSquadIds,
    fetchWorkspaceSprintSquads,
    getSprintSquadById,
    updateWorkspaceSprintAutomationSortOrder,
  } = useWorkspaceSprint();

  const workspaceSlugValue = workspaceSlug?.toString();
  const canCreateSprint = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  useEffect(() => {
    if (!workspaceSlugValue || automationFetchedMap[workspaceSlugValue]) return;
    fetchWorkspaceSprintSquads(workspaceSlugValue);
  }, [automationFetchedMap, fetchWorkspaceSprintSquads, workspaceSlugValue]);

  useEffect(() => {
    if (pathname.includes("/sprints")) setIsOpen(true);
  }, [pathname]);

  if (!workspaceSlugValue) return null;

  const automationIds = currentWorkspaceSprintSquadIds ?? [];
  const displayedAutomationIds = sprintPreferences.showLimitedSquads
    ? automationIds.slice(0, sprintPreferences.limitedSquadsCount)
    : automationIds;
  const hasMoreSquads =
    sprintPreferences.showLimitedSquads && automationIds.length > sprintPreferences.limitedSquadsCount;

  const handleOnAutomationDrop = (
    sourceId: string | undefined,
    destinationId: string | undefined,
    shouldDropBelow: boolean
  ) => {
    if (!sourceId || !destinationId || !workspaceSlugValue || sourceId === destinationId) return;

    const sortedIds = automationIds.filter((automationId) => automationId !== sourceId);
    const destinationIndex = sortedIds.indexOf(destinationId);
    if (destinationIndex < 0) return;

    const insertIndex = shouldDropBelow ? destinationIndex + 1 : destinationIndex;
    const previousAutomation = getSprintSquadById(sortedIds[insertIndex - 1]);
    const nextAutomation = getSprintSquadById(sortedIds[insertIndex]);

    let sortOrder: number;
    if (previousAutomation && nextAutomation)
      sortOrder = (previousAutomation.sort_order + nextAutomation.sort_order) / 2;
    else if (previousAutomation) sortOrder = previousAutomation.sort_order + 1000;
    else if (nextAutomation) sortOrder = nextAutomation.sort_order - 1000;
    else sortOrder = getSprintSquadById(sourceId)?.sort_order ?? 1000;

    updateWorkspaceSprintAutomationSortOrder(workspaceSlugValue, sourceId, sortOrder).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Could not reorder sprints",
        message: "Please try again.",
      });
    });
  };

  return (
    <>
      <SprintAutomationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(automationId) => router.push(`/${workspaceSlugValue}/sprints/${automationId}`)}
      />
      <Disclosure as="div" className="flex flex-col" defaultOpen>
        <div className="group flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-placeholder hover:bg-layer-transparent-hover">
          <Disclosure.Button
            as="button"
            type="button"
            className="flex w-full items-center gap-1 text-left text-13 font-semibold whitespace-nowrap text-placeholder"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close sprints menu" : "Open sprints menu"}
          >
            <span className="text-13 font-semibold">Squads</span>
          </Disclosure.Button>
          <div className="flex items-center gap-1">
            {canCreateSprint && (
              <Tooltip tooltipHeading="Create squad" tooltipContent="">
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={PlusIcon}
                  onClick={() => setIsCreateModalOpen(true)}
                  className="hidden text-placeholder group-hover:inline-flex"
                  aria-label="Create squad"
                />
              </Tooltip>
            )}
            <IconButton
              variant="ghost"
              size="sm"
              icon={ChevronRightIcon}
              onClick={() => setIsOpen(!isOpen)}
              className="text-placeholder"
              iconClassName={cn("transition-transform", {
                "rotate-90": isOpen,
              })}
              aria-label={isOpen ? "Close sprints menu" : "Open sprints menu"}
            />
          </div>
        </div>
        <Transition
          show={isOpen}
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          {isOpen && (
            <Disclosure.Panel as="div" className="flex flex-col gap-0.5" static>
              {automationIds.length > 0 ? (
                <>
                  {displayedAutomationIds.map((automationId: string, index) => (
                    <SidebarSprintGroupItem
                      key={automationId}
                      automationId={automationId}
                      workspaceSlug={workspaceSlugValue}
                      canReorder={canCreateSprint}
                      navigationMode={sprintPreferences.navigationMode}
                      isLastChild={index === displayedAutomationIds.length - 1}
                      handleOnAutomationDrop={handleOnAutomationDrop}
                    />
                  ))}
                  {hasMoreSquads && (
                    <SidebarNavItem>
                      <button
                        type="button"
                        onClick={() => router.push(`/${workspaceSlugValue}/squads`)}
                        className="flex flex-grow items-center gap-1.5 text-13 font-medium text-tertiary"
                        aria-label="View all squads"
                      >
                        <MoreHorizontal className="size-4 flex-shrink-0" />
                        <span>More</span>
                      </button>
                    </SidebarNavItem>
                  )}
                </>
              ) : (
                <div className="px-2 py-1.5 text-12 text-tertiary">No sprints yet</div>
              )}
            </Disclosure.Panel>
          )}
        </Transition>
      </Disclosure>
    </>
  );
});

type SprintGroupItemProps = {
  automationId: string;
  canReorder: boolean;
  handleOnAutomationDrop: (
    sourceId: string | undefined,
    destinationId: string | undefined,
    shouldDropBelow: boolean
  ) => void;
  isLastChild: boolean;
  navigationMode: TSprintNavigationMode;
  workspaceSlug: string;
};

const SidebarSprintGroupItem = observer(function SidebarSprintGroupItem(props: SprintGroupItemProps) {
  const { automationId, canReorder, handleOnAutomationDrop, isLastChild, navigationMode, workspaceSlug } = props;
  const [isOpen, setIsOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [instruction, setInstruction] = useState<"DRAG_OVER" | "DRAG_BELOW" | undefined>(undefined);
  const itemRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLButtonElement | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile } = usePlatformOS();
  const { fetchWorkspaceSprints, getSprintSquadById, getSprintById, getSprintsBySquadId } = useWorkspaceSprint();

  const automation = getSprintSquadById(automationId);
  const sprintIds = getSprintsBySquadId(automationId);
  const detailsHref = `/${workspaceSlug}/sprints/${automationId}`;
  const firstSprintHref = sprintIds[0] ? `/${workspaceSlug}/sprints/work-items/${sprintIds[0]}` : detailsHref;
  const { workspaceSprintId } = useParams();
  const selectedSprintId = workspaceSprintId?.toString();
  const hasSelectedSprint = selectedSprintId ? sprintIds.includes(selectedSprintId) : false;
  const isAccordionMode = navigationMode === "ACCORDION";
  const isActive = !isAccordionMode && (pathname.includes(`/sprints/${automationId}`) || hasSelectedSprint);

  useEffect(() => {
    fetchWorkspaceSprints(workspaceSlug, automationId);
  }, [automationId, fetchWorkspaceSprints, workspaceSlug]);

  useEffect(() => {
    if (isAccordionMode && (pathname.includes(`/sprints/${automationId}`) || hasSelectedSprint)) setIsOpen(true);
  }, [automationId, hasSelectedSprint, isAccordionMode, pathname]);

  useEffect(() => {
    const itemElement = itemRef.current;
    const dragHandleElement = dragHandleRef.current;
    if (!itemElement) return;

    return combine(
      draggable({
        element: itemElement,
        canDrag: () => canReorder,
        dragHandle: dragHandleElement ?? undefined,
        getInitialData: () => ({ id: automationId, dragInstanceId: "WORKSPACE_SPRINT_AUTOMATIONS" }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element: itemElement,
        canDrop: ({ source }) =>
          canReorder &&
          source?.data?.id !== automationId &&
          source?.data?.dragInstanceId === "WORKSPACE_SPRINT_AUTOMATIONS",
        getData: ({ input, element }) =>
          attachInstruction(
            { id: automationId },
            {
              input,
              element,
              currentLevel: 0,
              indentPerLevel: 0,
              mode: isLastChild ? "last-in-group" : "standard",
            }
          ),
        onDrag: ({ self }) => {
          const extractedInstruction = extractInstruction(self?.data)?.type;
          setInstruction(
            extractedInstruction
              ? extractedInstruction === "reorder-below" && isLastChild
                ? "DRAG_BELOW"
                : "DRAG_OVER"
              : undefined
          );
        },
        onDragLeave: () => setInstruction(undefined),
        onDrop: ({ self, source }) => {
          setInstruction(undefined);
          const extractedInstruction = extractInstruction(self?.data)?.type;
          const currentInstruction = extractedInstruction
            ? extractedInstruction === "reorder-below" && isLastChild
              ? "DRAG_BELOW"
              : "DRAG_OVER"
            : undefined;
          if (!currentInstruction) return;

          handleOnAutomationDrop(
            source?.data?.id as string | undefined,
            self?.data?.id as string | undefined,
            currentInstruction === "DRAG_BELOW"
          );
        },
      })
    );
  }, [automationId, canReorder, handleOnAutomationDrop, isLastChild]);

  if (!automation) return null;

  const handleItemClick = () => {
    if (isAccordionMode) {
      setIsOpen(!isOpen);
    } else {
      router.push(firstSprintHref);
    }
  };

  return (
    <Disclosure as="div" className="flex flex-col" defaultOpen>
      <div
        ref={itemRef}
        className={cn("relative", {
          "bg-layer-1 opacity-60": isDragging,
        })}
      >
        <DropIndicator classNames="absolute top-0" isVisible={instruction === "DRAG_OVER"} />
        <div
          className={cn(
            "group/sprint-item relative flex w-full items-center justify-between rounded-md px-2 py-1 text-secondary hover:bg-layer-transparent-hover",
            {
              "bg-layer-transparent-active": isActive,
            }
          )}
        >
          {canReorder && (
            <Tooltip isMobile={isMobile} tooltipContent="Drag to rearrange" position="top-end" disabled={isDragging}>
              <button
                type="button"
                className={cn(
                  "absolute top-1/2 -left-3 hidden -translate-y-1/2 cursor-grab items-center justify-center rounded-sm text-placeholder group-hover/sprint-item:flex",
                  {
                    "cursor-grabbing": isDragging,
                  }
                )}
                ref={dragHandleRef}
              >
                <DragHandle className="bg-transparent" />
              </button>
            </Tooltip>
          )}
          <button
            type="button"
            onClick={handleItemClick}
            className="flex min-w-0 flex-grow items-center gap-1.5 text-left"
            aria-label={isOpen ? "Close sprint menu" : "Open sprint menu"}
          >
            {automation.logo_props?.in_use ? (
              <Logo logo={automation.logo_props} size={16} type="material" />
            ) : (
              getSidebarNavigationItemIcon(SPRINT_SIDEBAR_ICON_KEYS.squad)
            )}
            <span className="truncate text-13 font-medium">{automation.name}</span>
          </button>
          <div className="flex items-center gap-1">
            <CustomMenu
              customButton={
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={MoreHorizontal}
                  className="hidden text-placeholder group-hover/sprint-item:inline-flex"
                />
              }
              customButtonClassName="grid place-items-center"
              placement="bottom-start"
              ariaLabel="Squad actions"
              closeOnSelect
            >
              <CustomMenu.MenuItem onClick={() => router.push(`${detailsHref}?view=settings`)}>
                <span className="flex items-center justify-start gap-2">
                  <Settings className="h-3.5 w-3.5 stroke-[1.5]" />
                  <span>Settings</span>
                </span>
              </CustomMenu.MenuItem>
            </CustomMenu>
            {isAccordionMode && (
              <IconButton
                variant="ghost"
                size="sm"
                icon={ChevronRightIcon}
                onClick={() => setIsOpen(!isOpen)}
                className="hidden text-placeholder group-hover/sprint-item:inline-flex"
                iconClassName={cn("transition-transform", {
                  "rotate-90": isOpen,
                })}
                aria-label={isOpen ? "Close sprint menu" : "Open sprint menu"}
              />
            )}
          </div>
        </div>
      </div>
      <DropIndicator classNames="relative" isVisible={instruction === "DRAG_BELOW"} />
      {isAccordionMode && (
        <Transition
          show={isOpen}
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          {isOpen && (
            <Disclosure.Panel as="div" className="flex flex-col gap-0.5" static>
              {sprintIds.length > 0 ? (
                sprintIds.map((sprintId: string) => {
                  const sprint = getSprintById(sprintId);
                  if (!sprint) return null;
                  const href = `/${workspaceSlug}/sprints/work-items/${sprint.id}`;
                  return (
                    <Link key={sprint.id} href={href}>
                      <SidebarNavItem isActive={selectedSprintId === sprint.id} className="ml-6">
                        <div className="flex w-full items-center gap-1.5 py-[1px]">
                          {getSidebarNavigationItemIcon(SPRINT_SIDEBAR_ICON_KEYS.sprint, "stroke-[1.5]")}
                          <span className="truncate text-11 font-medium">{sprint.name}</span>
                        </div>
                      </SidebarNavItem>
                    </Link>
                  );
                })
              ) : (
                <div className="px-8 py-1 text-11 text-tertiary">No open sprints</div>
              )}
            </Disclosure.Panel>
          )}
        </Transition>
      )}
    </Disclosure>
  );
});
