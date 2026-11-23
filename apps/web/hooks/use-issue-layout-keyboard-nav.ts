/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef } from "react";
// hooks
import { useKeyboardNavStore } from "@/hooks/store/use-keyboard-nav-store";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
// store
import type { TKeyboardNavEntity } from "@/store/keyboard_nav.store";

type Props = {
  // ordered entity ids (render order) currently shown in the layout
  entities: TKeyboardNavEntity[];
  // scroll container that holds the rendered rows
  containerRef: React.MutableRefObject<HTMLElement | null>;
  // opens the work item peek for an entity
  openEntity: (entity: TKeyboardNavEntity) => void;
  // opens the work item at its own URL in a new browser tab
  openInNewTab: (entity: TKeyboardNavEntity) => void;
  // selection helpers from the layout's MultipleSelectGroup (may change identity every render)
  selectionHelpers: TSelectionHelper;
};

/**
 * @description Bridges a work-item layout (list / spreadsheet) to the
 * KeyboardNavStore: feeds the rendered entity order, registers the open / select
 * / scroll callbacks the power-k commands invoke, and resets the store when the
 * layout unmounts.
 *
 * Single-key commands (j/k/o/enter/x) are registered globally, so the store is
 * the only place they can consult - every callback therefore reads the latest
 * values through refs instead of closing over render-scoped objects.
 */
export const useIssueLayoutKeyboardNav = (props: Props) => {
  const { entities, containerRef, openEntity, openInNewTab, selectionHelpers } = props;
  // store hooks
  const keyboardNav = useKeyboardNavStore();
  // refs
  const selectionHelpersRef = useRef(selectionHelpers);
  const openEntityRef = useRef(openEntity);
  const openInNewTabRef = useRef(openInNewTab);

  useEffect(() => {
    selectionHelpersRef.current = selectionHelpers;
    openEntityRef.current = openEntity;
    openInNewTabRef.current = openInNewTab;
  }, [openEntity, openInNewTab, selectionHelpers]);

  const managers = useMemo(
    () => ({
      openEntity: (entity: TKeyboardNavEntity) => openEntityRef.current(entity),
      openInNewTab: (entity: TKeyboardNavEntity) => openInNewTabRef.current(entity),
      toggleSelection: (entity: TKeyboardNavEntity) => {
        const helpers = selectionHelpersRef.current;
        if (helpers.isSelectionDisabled) return;
        if (helpers.getIsEntitySelected(entity.entityID)) {
          helpers.handleEntitySelection(entity, false, "force-remove");
        } else {
          helpers.handleEntitySelection(entity, false, "force-add");
        }
      },
      scrollToEntity: (entity: TKeyboardNavEntity) => {
        const container = containerRef.current;
        if (!container) return;
        const element =
          container.querySelector<HTMLElement>(`[data-keyboard-nav-id="${entity.entityID}"]`) ??
          container.querySelector<HTMLElement>(`#issue-${CSS.escape(entity.entityID)}`);
        if (!element) return;
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const isOutOfView = elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom;
        if (isOutOfView) element.scrollIntoView({ block: "center" });
      },
    }),
    [containerRef]
  );

  // register the layout callbacks for the lifetime of the layout
  useEffect(() => {
    keyboardNav.setManagers(managers);
    return () => {
      keyboardNav.clear();
    };
  }, [keyboardNav, managers]);

  // fingerprint the rendered order so the store is fed on real changes only.
  // A regrouping or refilter can move the focused entity without removing it,
  // and the click-triggered scroll runs after `setOrderedEntities`, so the
  // cursor is re-pointed at the same entity rather than blindly reset.
  const entityKey = entities.map((entity) => `${entity.groupID}:${entity.entityID}`).join("|");
  // starts undefined so the first render always registers the rendered order
  const entityKeyRef = useRef<string | undefined>(undefined);
  const entitiesRef = useRef(entities);
  entitiesRef.current = entities;
  useEffect(() => {
    if (entityKeyRef.current === entityKey) return;
    entityKeyRef.current = entityKey;
    const focusedEntity = keyboardNav.getFocusedEntity();
    keyboardNav.setOrderedEntities(entitiesRef.current);
    if (focusedEntity) keyboardNav.focusEntity(focusedEntity.entityID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboardNav, entityKey]);
};
