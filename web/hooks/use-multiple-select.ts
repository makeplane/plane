import { useCallback, useEffect, useState } from "react";

export type TEntityDetails = {
  entityID: string;
  groupID: string;
};

type Props = {
  containerRef: React.MutableRefObject<HTMLElement | null>;
  entities: TEntityDetails[]; // { groupID: entityIds[] }
  groups: string[];
};

export type TSelectionSnapshot = {
  isSelectionActive: boolean;
  selectedEntityIds: string[];
};

export type TSelectionHelper = {
  handleClearSelection: () => void;
  handleEntityClick: (event: React.MouseEvent, entityID: string, groupId: string) => void;
  isEntitySelected: (entityID: string) => boolean;
  isEntityActive: (entityID: string) => boolean;
  handleGroupClick: (groupID: string) => void;
  isGroupSelected: (groupID: string) => "empty" | "partial" | "complete";
};

export const useMultipleSelect = (props: Props) => {
  const { containerRef, entities, groups } = props;
  // states
  const [selectedEntityDetails, setSelectedEntityDetails] = useState<TEntityDetails[]>([]);
  const [lastSelectedEntityDetails, setLastSelectedEntityDetails] = useState<TEntityDetails | null>(null);
  const [previousActiveEntity, setPreviousActiveEntity] = useState<TEntityDetails | null>(null);
  const [nextActiveEntity, setNextActiveEntity] = useState<TEntityDetails | null>(null);
  const [activeEntityDetails, setActiveEntityDetails] = useState<TEntityDetails | null>(null);

  /**
   * @description clear all selection
   */
  const handleClearSelection = useCallback(() => {
    setSelectedEntityDetails([]);
    setLastSelectedEntityDetails(null);
    setPreviousActiveEntity(null);
    setNextActiveEntity(null);
    setActiveEntityDetails(null);
  }, []);

  const getPreviousAndNextEntities = useCallback(
    (entityID: string) => {
      const currentEntityIndex = entities.findIndex((entity) => entity?.entityID === entityID);

      // entity position
      const isFirstEntity = currentEntityIndex === 0;
      const isLastEntity = currentEntityIndex === entities.length - 1;

      let previousEntity: TEntityDetails | null = null;
      let nextEntity: TEntityDetails | null = null;

      if (isLastEntity) {
        nextEntity = null;
      } else {
        nextEntity = entities[currentEntityIndex + 1];
      }

      if (isFirstEntity) {
        previousEntity = null;
      } else {
        previousEntity = entities[currentEntityIndex - 1];
      }

      return {
        previousEntity,
        nextEntity,
      };
    },
    [entities]
  );

  const updateActiveEntityDetails = useCallback(
    (entityDetails: TEntityDetails | null) => {
      if (!entityDetails) {
        setActiveEntityDetails(null);
        setPreviousActiveEntity(null);
        setNextActiveEntity(null);
        return;
      }

      setActiveEntityDetails({
        entityID: entityDetails.entityID,
        groupID: entityDetails.groupID,
      });

      const activeElement = document.querySelector(
        `[data-entity-id="${entityDetails.entityID}"][data-entity-group-id="${entityDetails.groupID}"]`
      );

      if (activeElement && containerRef.current) {
        const SCROLL_OFFSET = 160;
        const containerRect = containerRef.current.getBoundingClientRect();
        const elementRect = activeElement.getBoundingClientRect();

        const isInView =
          elementRect.top >= containerRect.top + SCROLL_OFFSET &&
          elementRect.bottom <= containerRect.bottom - SCROLL_OFFSET;

        if (!isInView) {
          containerRef.current.scrollBy({
            top: elementRect.top < containerRect.top + SCROLL_OFFSET ? -50 : 50,
            behavior: "smooth",
          });
        }
      }

      const { previousEntity: previousActiveEntity, nextEntity: nextActiveEntity } = getPreviousAndNextEntities(
        entityDetails.entityID
      );
      setPreviousActiveEntity(previousActiveEntity);
      setNextActiveEntity(nextActiveEntity);
    },
    [containerRef, getPreviousAndNextEntities]
  );

  const handleEntitySelection = useCallback(
    (entityID: string, groupID: string) => {
      const index = selectedEntityDetails.findIndex((en) => en.entityID === entityID && en.groupID === groupID);

      if (index === -1) {
        setSelectedEntityDetails((prev) => [...prev, { entityID, groupID }]);
        setLastSelectedEntityDetails({ entityID, groupID });
        updateActiveEntityDetails({ entityID, groupID });
      } else {
        const newSelectedEntities = [...selectedEntityDetails];
        newSelectedEntities.splice(index, 1);
        setSelectedEntityDetails(newSelectedEntities);
        const newLastEntity = newSelectedEntities[newSelectedEntities.length - 1];
        setLastSelectedEntityDetails(newLastEntity ?? null);
        // updateActiveEntityDetails(newLastEntity ?? null);
      }
    },
    [selectedEntityDetails, updateActiveEntityDetails]
  );

  /**
   * @description toggle entity selection
   * @param {React.MouseEvent} event
   * @param {string} entityID
   * @param {string} groupID
   */
  const handleEntityClick = useCallback(
    (e: React.MouseEvent, entityID: string, groupID: string) => {
      if (e.shiftKey && lastSelectedEntityDetails) {
        const currentEntityIndex = entities.findIndex((entity) => entity?.entityID === entityID);

        const lastEntityIndex = entities.findIndex((entity) => entity?.entityID === lastSelectedEntityDetails.entityID);
        if (lastEntityIndex < currentEntityIndex) {
          for (let i = lastEntityIndex + 1; i <= currentEntityIndex; i++) {
            const entityDetails = entities[i];
            if (entityDetails) {
              handleEntitySelection(entityDetails.entityID, entityDetails.groupID);
            }
          }
        } else if (lastEntityIndex > currentEntityIndex) {
          for (let i = currentEntityIndex; i <= lastEntityIndex - 1; i++) {
            const entityDetails = entities[i];
            if (entityDetails) {
              handleEntitySelection(entityDetails.entityID, entityDetails.groupID);
            }
          }
        } else {
          const startIndex = lastEntityIndex + 1;
          const endIndex = currentEntityIndex;
          for (let i = startIndex; i <= endIndex; i++) {
            const entityDetails = entities[i];
            if (entityDetails) {
              handleEntitySelection(entityDetails.entityID, entityDetails.groupID);
            }
          }
        }
        return;
      }

      handleEntitySelection(entityID, groupID);
    },
    [entities, handleEntitySelection, lastSelectedEntityDetails]
  );

  /**
   * @description check if entity is selected or not
   * @param {string} entityID
   * @returns {boolean}
   */
  const isEntitySelected = useCallback(
    (entityID: string) => !!selectedEntityDetails.find((en) => en.entityID === entityID),
    [selectedEntityDetails]
  );

  /**
   * @description check if entity is active or not
   * @param {string} entityID
   * @returns {boolean}
   */
  const isEntityActive = useCallback(
    (entityID: string) => activeEntityDetails?.entityID === entityID,
    [activeEntityDetails]
  );

  /**
   * @description toggle group selection
   * @param {string} groupID
   */
  const handleGroupClick = useCallback(
    (groupID: string) => {
      const groupEntities = entities.filter((entity) => entity.groupID === groupID);
      groupEntities.forEach((entity) => {
        handleEntitySelection(entity.entityID, groupID);
      });
    },
    [entities, handleEntitySelection]
  );

  /**
   * @description check if any entity of the group is selected
   * @param {string} groupID
   * @returns {boolean}
   */
  const isGroupSelected = useCallback(
    (groupID: string) => {
      const groupEntities = entities.filter((entity) => entity.groupID === groupID);
      const totalSelected = groupEntities.filter((entity) => isEntitySelected(entity.entityID ?? "")).length;
      if (totalSelected === 0) return "empty";
      if (totalSelected === groupEntities.length) return "complete";
      return "partial";
    },
    [entities, isEntitySelected]
  );

  // clear selection on escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClearSelection();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClearSelection]);

  // select entities on shift + arrow up/down key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.shiftKey) return;

      if (e.key === "ArrowDown" && activeEntityDetails) {
        if (!nextActiveEntity) return;
        // console.log("selected by down", elementDetails.entityID);
        handleEntitySelection(nextActiveEntity.entityID, nextActiveEntity.groupID);
      }
      if (e.key === "ArrowUp" && activeEntityDetails) {
        if (!previousActiveEntity) return;
        // console.log("selected by up", elementDetails.entityID);
        handleEntitySelection(previousActiveEntity.entityID, previousActiveEntity.groupID);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    activeEntityDetails,
    handleEntitySelection,
    lastSelectedEntityDetails?.entityID,
    nextActiveEntity,
    previousActiveEntity,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // set active entity id to the first entity
      if (["ArrowUp", "ArrowDown"].includes(e.key) && !activeEntityDetails) {
        const firstElementDetails = entities[0];
        if (!firstElementDetails) return;
        updateActiveEntityDetails(firstElementDetails);
      }

      if (e.key === "ArrowDown" && activeEntityDetails) {
        if (!activeEntityDetails) return;
        const { nextEntity: nextActiveEntity } = getPreviousAndNextEntities(activeEntityDetails.entityID);
        if (nextActiveEntity) {
          updateActiveEntityDetails(nextActiveEntity);
        }
      }

      if (e.key === "ArrowUp" && activeEntityDetails) {
        if (!activeEntityDetails) return;
        const { previousEntity: previousActiveEntity } = getPreviousAndNextEntities(activeEntityDetails.entityID);
        if (previousActiveEntity) {
          updateActiveEntityDetails(previousActiveEntity);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeEntityDetails, entities, groups, getPreviousAndNextEntities, updateActiveEntityDetails]);

  /**
   * @description snapshot of the current state of selection
   */
  const snapshot: TSelectionSnapshot = {
    isSelectionActive: selectedEntityDetails.length > 0,
    selectedEntityIds: selectedEntityDetails.map((en) => en.entityID),
  };

  /**
   * @description helper functions for selection
   */
  const helpers: TSelectionHelper = {
    handleClearSelection,
    handleEntityClick,
    isEntitySelected,
    isEntityActive,
    handleGroupClick,
    isGroupSelected,
  };

  return {
    helpers,
    snapshot,
  };
};
