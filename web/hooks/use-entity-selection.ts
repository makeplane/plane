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
};

const groupElements: Record<string, NodeListOf<Element>> = {};

const getElementDetails = (element: Element) => ({
  entityID: element.getAttribute("data-entity-id") ?? "",
  groupID: element.getAttribute("data-entity-group-id") ?? "",
});

export const useEntitySelection = (props: Props) => {
  const { groups } = props;
  // states
  const [selectedEntities, setSelectedEntities] = useState<{ group: string; entity: string }[]>([]);
  const [lastGroupID, setLastGroupID] = useState<string | null>(null);
  const [lastEntityID, setLastEntityID] = useState<string | null>(null);
  const [previousEntity, setPreviousEntity] = useState<Element | null>(null);
  const [nextEntity, setNextEntity] = useState<Element | null>(null);

  /**
   * @description clear all selection
   */
  const handleClearSelection = useCallback(() => {
    setSelectedEntities([]);
    setLastGroupID(null);
    setLastEntityID(null);
    setPreviousEntity(null);
    setNextEntity(null);
  }, []);

  const handleEntitySelection = useCallback(
    (entityID: string, groupID: string) => {
      const index = selectedEntities.findIndex((en) => en.entity === entityID && en.group === groupID);

      const currentGroupElements = Array.from(groupElements[groupID]);
      const currentGroupIndex = groups.findIndex((key) => key === groupID);
      const currentEntityIndex = currentGroupElements.findIndex((el) => el.getAttribute("data-entity-id") === entityID);

      // group position
      const isFirstGroup = currentGroupIndex === 0;
      const isLastGroup = currentGroupIndex === groups.length - 1;
      // entity position
      const isFirstEntity = currentEntityIndex === 0;
      const isLastEntity = currentEntityIndex === currentGroupElements.length - 1;

      if (!isLastEntity) {
        setNextEntity(currentGroupElements[currentEntityIndex + 1]);
      } else {
        if (isLastGroup) setNextEntity(null);
        else setNextEntity(groupElements[groups[currentGroupIndex + 1]][0] ?? null);
      }

      if (!isFirstEntity) {
        setPreviousEntity(currentGroupElements[currentEntityIndex - 1]);
      } else {
        if (isFirstGroup) setPreviousEntity(null);
        else
          setPreviousEntity(
            groupElements[groups[currentGroupIndex - 1]][groupElements[groups[currentGroupIndex - 1]].length - 1] ??
              null
          );
      }

      if (index === -1) {
        setSelectedEntities((prev) => [...prev, { entity: entityID, group: groupID }]);
        setLastEntityID(entityID);
        setLastGroupID(groupID);
      } else {
        const newSelectedEntities = [...selectedEntities];
        newSelectedEntities.splice(index, 1);
        setSelectedEntities(newSelectedEntities);
        setLastEntityID(newSelectedEntities[newSelectedEntities.length - 1]?.entity ?? null);
        setLastGroupID(newSelectedEntities[newSelectedEntities.length - 1]?.group ?? null);
      }
    },
    [groups, selectedEntities]
  );

  /**
   * @description toggle entity selection
   * @param {React.MouseEvent} event
   * @param {string} entityID
   * @param {string} groupID
   */
  const handleEntityClick = useCallback(
    (e: React.MouseEvent, entityID: string, groupID: string) => {
      if (e.shiftKey && lastEntityID && lastGroupID) {
        const currentGroupElements = Array.from(groupElements[groupID]);
        const currentGroupIndex = groups.findIndex((key) => key === groupID);
        const currentEntityIndex = currentGroupElements.findIndex(
          (el) => el.getAttribute("data-entity-id") === entityID
        );

        const lastGroupElements = Array.from(groupElements[lastGroupID]);
        const lastGroupIndex = groups.findIndex((key) => key === lastGroupID);
        const lastEntityIndex = lastGroupElements.findIndex((el) => el.getAttribute("data-entity-id") === lastEntityID);
        if (lastGroupIndex < currentGroupIndex) {
          for (let i = lastGroupIndex; i <= currentGroupIndex; i++) {
            const startIndex = i === lastGroupIndex ? lastEntityIndex + 1 : 0;
            const endIndex = i === currentGroupIndex ? currentEntityIndex : groupElements[groups[i]].length - 1;
            for (let j = startIndex; j <= endIndex; j++) {
              const element = groupElements[groups[i]][j];
              const elementDetails = getElementDetails(element);
              if (element) {
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
              if (element) {
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
            if (element) {
              handleEntitySelection(elementDetails.entityID, elementDetails.groupID);
            }
          }
        }
        return;
      }

      handleEntitySelection(entityID, groupID);
    },
    [groups, handleEntitySelection, lastEntityID, lastGroupID]
  );

  /**
   * @description check if entity is selected or not
   * @param {string} entityID
   * @returns {boolean}
   */
  const isEntitySelected = useCallback(
    (entityID: string) => !!selectedEntities.find((en) => en.entity === entityID),
    [selectedEntities]
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
      if (e.shiftKey && e.key === "ArrowDown" && nextEntity) {
        const elementDetails = getElementDetails(nextEntity);
        handleEntitySelection(elementDetails.entityID, elementDetails.groupID);
      }
      if (e.shiftKey && e.key === "ArrowUp" && previousEntity) {
        const elementDetails = getElementDetails(previousEntity);
        handleEntitySelection(elementDetails.entityID, elementDetails.groupID);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleEntitySelection, nextEntity, previousEntity]);

  /**
   * @description snapshot of the current state of selection
   */
  const snapshot: TSelectionSnapshot = {
    isSelectionActive: selectedEntities.length > 0,
    selectedEntityIds: selectedEntities.map((en) => en.entity),
  };

  /**
   * @description helper functions for selection
   */
  const helpers: TSelectionHelper = {
    handleClearSelection,
    handleEntityClick,
    isEntitySelected,
  };

  return {
    helpers,
    snapshot,
  };
};
