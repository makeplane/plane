import { useCallback, useEffect, useState } from "react";

type Props = {
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

type TEntityDetails = {
  entityID: string;
  groupID: string;
};

const groupElements: Record<string, NodeListOf<Element>> = {};

/**
 * @description returns attribute values of the given element
 * @param {Element} element
 * @returns {TEntityDetails}
 */
const getElementDetails = (element: Element | undefined): TEntityDetails | null => {
  if (!element) return null;
  return {
    entityID: element.getAttribute("data-entity-id") ?? "",
    groupID: element.getAttribute("data-entity-group-id") ?? "",
  };
};

const getElement = (entityID: string): Element | null => {
  const element = document.querySelector(`[data-entity-id="${entityID}"]`);
  return element;
};

const getPreviousAndNextElements = (entityID: string, groupID: string, groups: string[]) => {
  const currentGroupElements = Array.from(groupElements[groupID]);
  const currentGroupIndex = groups.findIndex((key) => key === groupID);
  const currentEntityIndex = currentGroupElements.findIndex((el) => getElementDetails(el)?.entityID === entityID);

  // group position
  const isFirstGroup = currentGroupIndex === 0;
  const isLastGroup = currentGroupIndex === groups.length - 1;
  // entity position
  const isFirstEntity = currentEntityIndex === 0;
  const isLastEntity = currentEntityIndex === currentGroupElements.length - 1;

  let previousEntity: Element | null = null;
  let nextEntity: Element | null = null;

  if (!isLastEntity) {
    nextEntity = currentGroupElements[currentEntityIndex + 1];
  } else {
    if (isLastGroup) nextEntity = null;
    else nextEntity = groupElements[groups[currentGroupIndex + 1]][0] ?? null;
  }

  if (!isFirstEntity) {
    previousEntity = currentGroupElements[currentEntityIndex - 1];
  } else {
    if (isFirstGroup) previousEntity = null;
    else
      previousEntity =
        groupElements[groups[currentGroupIndex - 1]][groupElements[groups[currentGroupIndex - 1]].length - 1] ?? null;
  }

  return {
    previousEntity,
    nextEntity,
  };
};

export const useMultipleSelect = (props: Props) => {
  const { groups } = props;
  // states
  const [selectedEntityDetails, setSelectedEntityDetails] = useState<TEntityDetails[]>([]);
  const [lastSelectedEntityDetails, setLastSelectedEntityDetails] = useState<TEntityDetails | null>(null);
  const [previousActiveEntity, setPreviousActiveEntity] = useState<Element | null>(null);
  const [nextActiveEntity, setNextActiveEntity] = useState<Element | null>(null);
  const [activeEntityDetails, setActiveEntityDetails] = useState<TEntityDetails | null>(null);

  /**
   * @description clear all selection
   */
  const handleClearSelection = useCallback(() => {
    setSelectedEntityDetails([]);
    setLastSelectedEntityDetails(null);
    setPreviousActiveEntity(null);
    setNextActiveEntity(null);
  }, []);

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

      const { previousEntity: previousActiveEntity, nextEntity: nextActiveEntity } = getPreviousAndNextElements(
        entityDetails.entityID,
        entityDetails.groupID,
        groups
      );
      setPreviousActiveEntity(previousActiveEntity);
      setNextActiveEntity(nextActiveEntity);
    },
    [groups]
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
        if (newLastEntity) {
          setLastSelectedEntityDetails({
            entityID: newLastEntity.entityID,
            groupID: newLastEntity.groupID,
          });
          updateActiveEntityDetails(newLastEntity);
        } else {
          setLastSelectedEntityDetails(null);
          updateActiveEntityDetails(null);
        }
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
        const currentGroupElements = Array.from(groupElements[groupID]);
        const currentGroupIndex = groups.findIndex((key) => key === groupID);
        const currentEntityIndex = currentGroupElements.findIndex((el) => getElementDetails(el)?.entityID === entityID);

        const lastGroupElements = Array.from(groupElements[lastSelectedEntityDetails.groupID]);
        const lastGroupIndex = groups.findIndex((key) => key === lastSelectedEntityDetails.groupID);
        const lastEntityIndex = lastGroupElements.findIndex(
          (el) => getElementDetails(el)?.entityID === lastSelectedEntityDetails.entityID
        );
        if (lastGroupIndex < currentGroupIndex) {
          for (let i = lastGroupIndex; i <= currentGroupIndex; i++) {
            const startIndex = i === lastGroupIndex ? lastEntityIndex + 1 : 0;
            const endIndex = i === currentGroupIndex ? currentEntityIndex : groupElements[groups[i]].length - 1;
            for (let j = startIndex; j <= endIndex; j++) {
              const element = groupElements[groups[i]][j];
              const elementDetails = getElementDetails(element);
              if (elementDetails) {
                handleEntitySelection(elementDetails.entityID, elementDetails.groupID);
              }
            }
          }
        } else if (lastGroupIndex > currentGroupIndex) {
          for (let i = currentGroupIndex; i <= lastGroupIndex; i++) {
            const startIndex = i === currentGroupIndex ? currentEntityIndex : 0;
            const endIndex = i === lastGroupIndex ? lastEntityIndex - 1 : groupElements[groups[i]].length - 1;
            for (let j = startIndex; j <= endIndex; j++) {
              const element = groupElements[groups[i]][j];
              const elementDetails = getElementDetails(element);
              if (elementDetails) {
                handleEntitySelection(elementDetails.entityID, elementDetails.groupID);
              }
            }
          }
        } else {
          const startIndex = lastEntityIndex + 1;
          const endIndex = currentEntityIndex;
          for (let i = startIndex; i <= endIndex; i++) {
            const element = groupElements[groups[lastGroupIndex]][i];
            const elementDetails = getElementDetails(element);
            if (elementDetails) {
              handleEntitySelection(elementDetails.entityID, elementDetails.groupID);
            }
          }
        }
        return;
      }

      handleEntitySelection(entityID, groupID);
    },
    [groups, handleEntitySelection, lastSelectedEntityDetails]
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
   * @description check if any entity of the group is selected
   * @param {string} groupID
   * @returns {boolean}
   */
  const isGroupSelected = useCallback(
    (groupID: string) => {
      const currentGroupElements = groupElements[groupID];
      if (!currentGroupElements) return "empty";
      const groupElementsArray = Array.from(currentGroupElements);
      const totalSelected = groupElementsArray.filter((entity) =>
        isEntitySelected(getElementDetails(entity)?.entityID ?? "")
      ).length;
      if (totalSelected === 0) return "empty";
      if (totalSelected === currentGroupElements.length) return "complete";
      return "partial";
    },
    [isEntitySelected]
  );

  /**
   * @description toggle group selection
   * @param {string} groupID
   */
  const handleGroupClick = useCallback(
    (groupID: string) => {
      const currentGroupElements = groupElements[groupID];
      if (!currentGroupElements) return;

      const groupElementsArray = Array.from(currentGroupElements);

      groupElementsArray.forEach((element) => {
        const elementDetails = getElementDetails(element);
        if (elementDetails) {
          handleEntitySelection(elementDetails.entityID, elementDetails.groupID);
        }
      });
    },
    [handleEntitySelection]
  );

  useEffect(() => {
    const updateGroupElements = () => {
      groups.forEach((group) => {
        groupElements[group] = document.querySelectorAll(`[data-entity-group-id="${group}"]`);
      });
      // console.log("groupElements", groupElements);
    };

    // Initial update
    updateGroupElements();

    // Create a MutationObserver to watch for changes in the DOM
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList" || mutation.type === "attributes") {
          updateGroupElements();
          break;
        }
      }
    });

    // Start observing the document body for changes
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      observer.disconnect();
    };
  }, [groups]);

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
        let element: Element | null = null;
        if (activeEntityDetails.entityID === lastSelectedEntityDetails?.entityID) element = nextActiveEntity;
        else element = getElement(activeEntityDetails.entityID);
        if (!element) return;
        const elementDetails = getElementDetails(element ?? undefined);
        if (elementDetails) {
          handleEntitySelection(elementDetails.entityID, elementDetails.groupID);
        }
      }
      if (e.key === "ArrowUp" && activeEntityDetails) {
        let element: Element | null = null;
        if (activeEntityDetails.entityID === lastSelectedEntityDetails?.entityID) element = previousActiveEntity;
        else element = getElement(activeEntityDetails.entityID);
        if (!element) return;
        const elementDetails = getElementDetails(element);
        if (elementDetails) {
          handleEntitySelection(elementDetails.entityID, elementDetails.groupID);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleEntitySelection, nextActiveEntity, previousActiveEntity]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // set active entity id to the first entity
      if (["ArrowUp", "ArrowDown"].includes(e.key) && !activeEntityDetails) {
        const firstElementDetails = getElementDetails(groupElements[groups[0]][0]);
        if (!firstElementDetails) return;
        updateActiveEntityDetails(firstElementDetails);
      }

      if (e.key === "ArrowDown" && activeEntityDetails) {
        const element = getElement(activeEntityDetails.entityID);
        if (!element) return;
        const { nextEntity: nextActiveEntity } = getPreviousAndNextElements(
          activeEntityDetails.entityID,
          activeEntityDetails.groupID,
          groups
        );
        const nextElementDetails = getElementDetails(nextActiveEntity ?? undefined);
        if (nextElementDetails) {
          updateActiveEntityDetails(nextElementDetails);
        }
      }

      if (e.key === "ArrowUp" && activeEntityDetails) {
        const element = getElement(activeEntityDetails.entityID);
        if (!element) return;
        const { previousEntity: previousActiveEntity } = getPreviousAndNextElements(
          activeEntityDetails.entityID,
          activeEntityDetails.groupID,
          groups
        );
        const previousElementDetails = getElementDetails(previousActiveEntity ?? undefined);
        if (previousElementDetails) {
          updateActiveEntityDetails(previousElementDetails);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeEntityDetails, groups, updateActiveEntityDetails]);

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
