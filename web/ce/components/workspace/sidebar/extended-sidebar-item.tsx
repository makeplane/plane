import { FC, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachInstruction, extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Pin, PinOff } from "lucide-react";
// plane imports
import { EUserPermissionsLevel, IWorkspaceSidebarNavigationItem } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { DragHandle, DropIndicator, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { SidebarNavItem } from "@/components/sidebar";
// hooks
import { useAppTheme, useUser, useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web imports
// local imports
import { UpgradeBadge } from "../upgrade-badge";
import { getSidebarNavigationItemIcon } from "./helper";

type TExtendedSidebarItemProps = {
  item: IWorkspaceSidebarNavigationItem;
  handleOnNavigationItemDrop?: (
    sourceId: string | undefined,
    destinationId: string | undefined,
    shouldDropAtEnd: boolean
  ) => void;
  disableDrag?: boolean;
  disableDrop?: boolean;
  isLastChild: boolean;
};

export const ExtendedSidebarItem: FC<TExtendedSidebarItemProps> = observer((props) => {
  const { item, handleOnNavigationItemDrop, disableDrag = false, disableDrop = false, isLastChild } = props;
  const { t } = useTranslation();
  // states
  const [isDragging, setIsDragging] = useState(false);
  const [instruction, setInstruction] = useState<"DRAG_OVER" | "DRAG_BELOW" | undefined>(undefined);
  // refs
  const navigationIemRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLButtonElement | null>(null);

  // nextjs hooks
  const pathname = usePathname();
  const { workspaceSlug } = useParams();
  // store hooks
  const { getNavigationPreferences, updateSidebarPreference } = useWorkspace();
  const { toggleExtendedSidebar } = useAppTheme();
  const { data } = useUser();
  const { allowPermissions } = useUserPermissions();

  // derived values
  const sidebarPreference = getNavigationPreferences(workspaceSlug.toString());
  const isPinned = sidebarPreference?.[item.key]?.is_pinned;

  const handleLinkClick = () => toggleExtendedSidebar(true);

  if (!allowPermissions(item.access as any, EUserPermissionsLevel.WORKSPACE, workspaceSlug.toString())) {
    return null;
  }

  const itemHref =
    item.key === "your_work"
      ? `/${workspaceSlug.toString()}${item.href}${data?.id}`
      : `/${workspaceSlug.toString()}${item.href}`;
  const isActive = itemHref === pathname;

  const pinNavigationItem = (workspaceSlug: string, key: string) => {
    updateSidebarPreference(workspaceSlug, key, { is_pinned: true });
  };

  const unPinNavigationItem = (workspaceSlug: string, key: string) => {
    updateSidebarPreference(workspaceSlug, key, { is_pinned: false });
  };

  const icon = getSidebarNavigationItemIcon(item.key);

  useEffect(() => {
    const element = navigationIemRef.current;
    const dragHandleElement = dragHandleRef.current;

    if (!element) return;

    return combine(
      draggable({
        element,
        canDrag: () => !disableDrag,
        dragHandle: dragHandleElement ?? undefined,
        getInitialData: () => ({ id: item.key, dragInstanceId: "NAVIGATION" }), // var1
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) =>
          !disableDrop && source?.data?.id !== item.key && source?.data?.dragInstanceId === "NAVIGATION",
        getData: ({ input, element }) => {
          const data = { id: item.key };

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

          if (handleOnNavigationItemDrop)
            handleOnNavigationItemDrop(sourceId, destinationId, currentInstruction === "DRAG_BELOW");
        },
      })
    );
  }, [isLastChild, handleOnNavigationItemDrop, disableDrag, disableDrop, item.key]);

  return (
    <div
      id={`sidebar-${item.key}`}
      className={cn("relative", { "bg-custom-sidebar-background-80 opacity-60": isDragging })}
      ref={navigationIemRef}
    >
      <DropIndicator classNames="absolute top-0" isVisible={instruction === "DRAG_OVER"} />
      <div
        className={cn(
          "group/project-item relative w-full  flex items-center rounded-md text-custom-sidebar-text-100 hover:bg-custom-sidebar-background-90"
        )}
        id={`${item.key}`}
      >
        {!disableDrag && (
          <Tooltip
            // isMobile={isMobile}
            tooltipContent={t("drag_to_rearrange")}
            position="top-right"
            disabled={isDragging}
          >
            <button
              type="button"
              className={cn(
                "flex items-center justify-center absolute top-1/2 -left-3 -translate-y-1/2 rounded text-custom-sidebar-text-400 cursor-grab",
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
        <SidebarNavItem isActive={isActive}>
          <Link href={itemHref} onClick={() => handleLinkClick()} className="group flex-grow">
            <div className="flex items-center gap-1.5 py-[1px]">
              {icon}
              <p className="text-sm leading-5 font-medium">{t(item.labelTranslationKey)}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {item.key === "active_cycles" && (
              <div className="flex-shrink-0">
                <UpgradeBadge />
              </div>
            )}
            {isPinned ? (
              <Tooltip tooltipContent="Unpin">
                <PinOff
                  className="size-3.5 flex-shrink-0 hover:text-custom-text-300 outline-none text-custom-text-400"
                  onClick={() => unPinNavigationItem(workspaceSlug.toString(), item.key)}
                />
              </Tooltip>
            ) : (
              <Tooltip tooltipContent="Pin">
                <Pin
                  className="size-3.5 flex-shrink-0 hover:text-custom-text-300 outline-none text-custom-text-400"
                  onClick={() => pinNavigationItem(workspaceSlug.toString(), item.key)}
                />
              </Tooltip>
            )}
          </div>
        </SidebarNavItem>
      </div>
      {isLastChild && <DropIndicator isVisible={instruction === "DRAG_BELOW"} />}
    </div>
  );
});
