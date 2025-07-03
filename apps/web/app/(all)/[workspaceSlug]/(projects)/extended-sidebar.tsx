"use client";

import React, { useMemo, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
// hooks
import { useAppTheme, useWorkspace } from "@/hooks/store";
// plane-web imports
import { ExtendedSidebarItem } from "@/plane-web/components/workspace/sidebar";
import { ExtendedSidebarWrapper } from "./extended-sidebar-wrapper";

export const ExtendedAppSidebar = observer(() => {
  // refs
  const extendedSidebarRef = useRef<HTMLDivElement | null>(null);
  // routers
  const { workspaceSlug } = useParams();
  // store hooks
  const { isExtendedSidebarOpened, toggleExtendedSidebar } = useAppTheme();
  const { updateSidebarPreference, getNavigationPreferences } = useWorkspace();

  // derived values
  const currentWorkspaceNavigationPreferences = getNavigationPreferences(workspaceSlug.toString());

  const sortedNavigationItems = useMemo(
    () =>
      WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS.map((item) => {
        const preference = currentWorkspaceNavigationPreferences?.[item.key];
        return {
          ...item,
          sort_order: preference ? preference.sort_order : 0,
        };
      }).sort((a, b) => a.sort_order - b.sort_order),
    [currentWorkspaceNavigationPreferences]
  );

  const sortedNavigationItemsKeys = sortedNavigationItems.map((item) => item.key);

  const orderNavigationItem = (
    sourceIndex: number,
    destinationIndex: number,
    navigationList: {
      sort_order: number;
      key: string;
      labelTranslationKey: string;
      href: string;
      access: EUserWorkspaceRoles[];
    }[]
  ): number | undefined => {
    if (sourceIndex < 0 || destinationIndex < 0 || navigationList.length <= 0) return undefined;

    let updatedSortOrder: number | undefined = undefined;
    const sortOrderDefaultValue = 10000;

    if (destinationIndex === 0) {
      // updating project at the top of the project
      const currentSortOrder = navigationList[destinationIndex].sort_order || 0;
      updatedSortOrder = currentSortOrder - sortOrderDefaultValue;
    } else if (destinationIndex === navigationList.length) {
      // updating project at the bottom of the project
      const currentSortOrder = navigationList[destinationIndex - 1].sort_order || 0;
      updatedSortOrder = currentSortOrder + sortOrderDefaultValue;
    } else {
      // updating project in the middle of the project
      const destinationTopProjectSortOrder = navigationList[destinationIndex - 1].sort_order || 0;
      const destinationBottomProjectSortOrder = navigationList[destinationIndex].sort_order || 0;
      const updatedValue = (destinationTopProjectSortOrder + destinationBottomProjectSortOrder) / 2;
      updatedSortOrder = updatedValue;
    }

    return updatedSortOrder;
  };

  const handleOnNavigationItemDrop = (
    sourceId: string | undefined,
    destinationId: string | undefined,
    shouldDropAtEnd: boolean
  ) => {
    if (!sourceId || !destinationId || !workspaceSlug) return;
    if (sourceId === destinationId) return;

    const sourceIndex = sortedNavigationItemsKeys.indexOf(sourceId);
    const destinationIndex = shouldDropAtEnd
      ? sortedNavigationItemsKeys.length
      : sortedNavigationItemsKeys.indexOf(destinationId);

    const updatedSortOrder = orderNavigationItem(sourceIndex, destinationIndex, sortedNavigationItems);

    if (updatedSortOrder != undefined)
      updateSidebarPreference(workspaceSlug.toString(), sourceId, {
        sort_order: updatedSortOrder,
      });
  };

  const handleClose = () => toggleExtendedSidebar(false);

  return (
    <ExtendedSidebarWrapper
      isExtendedSidebarOpened={!!isExtendedSidebarOpened}
      extendedSidebarRef={extendedSidebarRef}
      handleClose={handleClose}
      excludedElementId="extended-sidebar-toggle"
    >
      {sortedNavigationItems.map((item, index) => (
        <ExtendedSidebarItem
          key={item.key}
          item={item}
          isLastChild={index === sortedNavigationItems.length - 1}
          handleOnNavigationItemDrop={handleOnNavigationItemDrop}
        />
      ))}
    </ExtendedSidebarWrapper>
  );
});
