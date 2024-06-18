"use client";

import { useCallback, useEffect, useMemo } from "react";
// hooks
import { useMultipleSelectStore } from "@/hooks/store";

export type TEntityDetails = {
  entityID: string;
  groupID: string;
};

type Props = {
  containerRef: React.MutableRefObject<HTMLElement | null>;
  disabled: boolean;
  entities: Record<string, string[]>; // { groupID: entityIds[] }
};

export type TSelectionSnapshot = {
  isSelectionActive: boolean;
  selectedEntityIds: string[];
};

export type TSelectionHelper = {
  handleClearSelection: () => void;
  handleEntityClick: (event: React.MouseEvent, entityID: string, groupId: string) => void;
  getIsEntitySelected: (entityID: string) => boolean;
  getIsEntityActive: (entityID: string) => boolean;
  handleGroupClick: (groupID: string) => void;
  isGroupSelected: (groupID: string) => "empty" | "partial" | "complete";
  isSelectionDisabled: boolean;
};

export const useMultipleSelect = (props: Props) => {
  const { containerRef, disabled, entities } = props;
  // router
  // const router = useAppRouter();
  // store hooks
  const {
    selectedEntityIds,
    updateSelectedEntityDetails,
    bulkUpdateSelectedEntityDetails,
    getActiveEntityDetails,
    updateActiveEntityDetails,
    getPreviousActiveEntity,
    updatePreviousActiveEntity,
    getNextActiveEntity,
    updateNextActiveEntity,
    getLastSelectedEntityDetails,
    clearSelection,
    getIsEntitySelected,
    getIsEntityActive,
    getEntityDetailsFromEntityID,
  } = useMultipleSelectStore();

  const groups = useMemo(() => Object.keys(entities), [entities]);

  const entitiesList: TEntityDetails[] = useMemo(
    () =>
      groups
        ?.map((groupID) =>
          entities?.[groupID]?.map((entityID) => ({
            entityID,
            groupID,
          }))
        )
        .flat(1),
    [entities, groups]
  );

  const getPreviousAndNextEntities = useCallback(
    (entityID: string) => {
      const currentEntityIndex = entitiesList.findIndex((entity) => entity?.entityID === entityID);

      // entity position
      const isFirstEntity = currentEntityIndex === 0;
      const isLastEntity = currentEntityIndex === entitiesList.length - 1;

      let previousEntity: TEntityDetails | null = null;
      let nextEntity: TEntityDetails | null = null;

      if (isLastEntity) {
        nextEntity = null;
      } else {
        nextEntity = entitiesList[currentEntityIndex + 1];
      }

      if (isFirstEntity) {
        previousEntity = null;
      } else {
        previousEntity = entitiesList[currentEntityIndex - 1];
      }

      return {
        previousEntity,
        nextEntity,
      };
    },
    [entitiesList]
  );

  const handleActiveEntityChange = useCallback(
    (entityDetails: TEntityDetails | null, shouldScroll: boolean = true) => {
      if (disabled) return;

      if (!entityDetails) {
        updateActiveEntityDetails(null);
        updatePreviousActiveEntity(null);
        updateNextActiveEntity(null);
        return;
      }

      updateActiveEntityDetails(entityDetails);

      // scroll to get the active element in view
      const activeElement = document.querySelector(
        `[data-entity-id="${entityDetails.entityID}"][data-entity-group-id="${entityDetails.groupID}"]`
      );
      if (activeElement && containerRef.current && shouldScroll) {
        const SCROLL_OFFSET = 200;
        const containerRect = containerRef.current.getBoundingClientRect();
        const elementRect = activeElement.getBoundingClientRect();

        const isInView =
          elementRect.top >= containerRect.top + SCROLL_OFFSET &&
          elementRect.bottom <= containerRect.bottom - SCROLL_OFFSET;

        if (!isInView) {
          containerRef.current.scrollBy({
            top: elementRect.top < containerRect.top + SCROLL_OFFSET ? -50 : 50,
          });
        }
      }

      const { previousEntity: previousActiveEntity, nextEntity: nextActiveEntity } = getPreviousAndNextEntities(
        entityDetails.entityID
      );
      updatePreviousActiveEntity(previousActiveEntity);
      updateNextActiveEntity(nextActiveEntity);
    },
    [
      containerRef,
      disabled,
      getPreviousAndNextEntities,
      updateActiveEntityDetails,
      updateNextActiveEntity,
      updatePreviousActiveEntity,
    ]
  );

  const handleEntitySelection = useCallback(
    (
      entityDetails: TEntityDetails | TEntityDetails[],
      shouldScroll: boolean = true,
      forceAction: "force-add" | "force-remove" | null = null
    ) => {
      if (disabled) return;

      if (Array.isArray(entityDetails)) {
        bulkUpdateSelectedEntityDetails(entityDetails, forceAction === "force-add" ? "add" : "remove");
        if (forceAction === "force-add" && entityDetails.length > 0) {
          handleActiveEntityChange(entityDetails[entityDetails.length - 1], shouldScroll);
        }
        return;
      }

      if (forceAction) {
        if (forceAction === "force-add") {
          console.log("force adding");
          updateSelectedEntityDetails(entityDetails, "add");
          handleActiveEntityChange(entityDetails, shouldScroll);
        }
        if (forceAction === "force-remove") {
          updateSelectedEntityDetails(entityDetails, "remove");
        }
        return;
      }

      const isSelected = getIsEntitySelected(entityDetails.entityID);
      if (isSelected) {
        updateSelectedEntityDetails(entityDetails, "remove");
        handleActiveEntityChange(entityDetails, shouldScroll);
      } else {
        updateSelectedEntityDetails(entityDetails, "add");
        handleActiveEntityChange(entityDetails, shouldScroll);
      }
    },
    [
      bulkUpdateSelectedEntityDetails,
      disabled,
      getIsEntitySelected,
      handleActiveEntityChange,
      updateSelectedEntityDetails,
    ]
  );

  /**
   * @description toggle entity selection
   * @param {React.MouseEvent} event
   * @param {string} entityID
   * @param {string} groupID
   */
  const handleEntityClick = useCallback(
    (e: React.MouseEvent, entityID: string, groupID: string) => {
      if (disabled) return;
      const lastSelectedEntityDetails = getLastSelectedEntityDetails();
      if (e.shiftKey && lastSelectedEntityDetails) {
        const currentEntityIndex = entitiesList.findIndex((entity) => entity?.entityID === entityID);

        const lastEntityIndex = entitiesList.findIndex(
          (entity) => entity?.entityID === lastSelectedEntityDetails.entityID
        );
        if (lastEntityIndex < currentEntityIndex) {
          for (let i = lastEntityIndex + 1; i <= currentEntityIndex; i++) {
            const entityDetails = entitiesList[i];
            if (entityDetails) {
              handleEntitySelection(entityDetails, false);
            }
          }
        } else if (lastEntityIndex > currentEntityIndex) {
          for (let i = currentEntityIndex; i <= lastEntityIndex - 1; i++) {
            const entityDetails = entitiesList[i];
            if (entityDetails) {
              handleEntitySelection(entityDetails, false);
            }
          }
        } else {
          const startIndex = lastEntityIndex + 1;
          const endIndex = currentEntityIndex;
          for (let i = startIndex; i <= endIndex; i++) {
            const entityDetails = entitiesList[i];
            if (entityDetails) {
              handleEntitySelection(entityDetails, false);
            }
          }
        }
        return;
      }

      handleEntitySelection({ entityID, groupID }, false);
    },
    [disabled, entitiesList, handleEntitySelection, getLastSelectedEntityDetails]
  );

  /**
   * @description check if any entity of the group is selected
   * @param {string} groupID
   * @returns {boolean}
   */
  const isGroupSelected = useCallback(
    (groupID: string) => {
      const groupEntities = entitiesList.filter((entity) => entity.groupID === groupID);
      const totalSelected = groupEntities.filter((entity) => getIsEntitySelected(entity?.entityID ?? "")).length;
      if (totalSelected === 0) return "empty";
      if (totalSelected === groupEntities.length) return "complete";
      return "partial";
    },
    [entitiesList, getIsEntitySelected]
  );

  /**
   * @description toggle group selection
   * @param {string} groupID
   */
  const handleGroupClick = useCallback(
    (groupID: string) => {
      if (disabled) return;

      const groupEntities = entitiesList.filter((entity) => entity.groupID === groupID);
      const groupSelectionStatus = isGroupSelected(groupID);
      handleEntitySelection(groupEntities, false, groupSelectionStatus === "empty" ? "force-add" : "force-remove");
    },
    [disabled, entitiesList, handleEntitySelection, isGroupSelected]
  );

  // select entities on shift + arrow up/down key press
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.shiftKey) return;

      const activeEntityDetails = getActiveEntityDetails();
      const nextActiveEntity = getNextActiveEntity();
      const previousActiveEntity = getPreviousActiveEntity();

      if (e.key === "ArrowDown" && activeEntityDetails) {
        if (!nextActiveEntity) return;
        handleEntitySelection(nextActiveEntity);
      }
      if (e.key === "ArrowUp" && activeEntityDetails) {
        if (!previousActiveEntity) return;
        handleEntitySelection(previousActiveEntity);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    disabled,
    getActiveEntityDetails,
    handleEntitySelection,
    getLastSelectedEntityDetails,
    getNextActiveEntity,
    getPreviousActiveEntity,
  ]);

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey) return;
      const activeEntityDetails = getActiveEntityDetails();
      // set active entity id to the first entity
      if (["ArrowUp", "ArrowDown"].includes(e.key) && !activeEntityDetails) {
        const firstElementDetails = entitiesList[0];
        if (!firstElementDetails) return;
        handleActiveEntityChange(firstElementDetails);
      }

      if (e.key === "ArrowDown" && activeEntityDetails) {
        if (!activeEntityDetails) return;
        const { nextEntity: nextActiveEntity } = getPreviousAndNextEntities(activeEntityDetails.entityID);
        if (nextActiveEntity) {
          handleActiveEntityChange(nextActiveEntity);
        }
      }

      if (e.key === "ArrowUp" && activeEntityDetails) {
        if (!activeEntityDetails) return;
        const { previousEntity: previousActiveEntity } = getPreviousAndNextEntities(activeEntityDetails.entityID);
        if (previousActiveEntity) {
          handleActiveEntityChange(previousActiveEntity);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [disabled, getActiveEntityDetails, entitiesList, groups, getPreviousAndNextEntities, handleActiveEntityChange]);

  // clear selection on route change
  // useEffect(() => {
  //   const handleRouteChange = () => clearSelection();

  //   router.events.on("routeChangeComplete", handleRouteChange);

  //   return () => {
  //     router.events.off("routeChangeComplete", handleRouteChange);
  //   };
  // }, [clearSelection, router.events]);

  // when entities list change, remove entityIds from the selected entities array, which are not present in the new list
  useEffect(() => {
    if (disabled) return;
    selectedEntityIds.map((entityID) => {
      const isEntityPresent = entitiesList.find((en) => en?.entityID === entityID);
      if (!isEntityPresent) {
        const entityDetails = getEntityDetailsFromEntityID(entityID);
        if (entityDetails) {
          handleEntitySelection(entityDetails);
        }
      }
    });
  }, [disabled, entitiesList, getEntityDetailsFromEntityID, handleEntitySelection, selectedEntityIds]);

  /**
   * @description helper functions for selection
   */
  const helpers: TSelectionHelper = useMemo(
    () => ({
      handleClearSelection: clearSelection,
      handleEntityClick,
      getIsEntitySelected,
      getIsEntityActive,
      handleGroupClick,
      isGroupSelected,
      isSelectionDisabled: disabled,
    }),
    [
      clearSelection,
      disabled,
      getIsEntityActive,
      getIsEntitySelected,
      handleEntityClick,
      handleGroupClick,
      isGroupSelected,
    ]
  );

  return helpers;
};
