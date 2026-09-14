/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeObservable, observable, runInAction } from "mobx";

export type TKeyboardNavEntity = {
  entityID: string;
  groupID: string;
};

/**
 * @description Callbacks the active work-item layout contributes to the
 * keyboard navigation layer: opening the focused work item and toggling its
 * multi-select state. The layout owns workspace/project context and selection
 * helpers, so it registers these once per mount and the power-k commands call
 * through them.
 */
export type TKeyboardNavManagers = {
  openEntity: (entity: TKeyboardNavEntity) => void;
  // opens the work item at its own URL (browser tab), not inside the peek panel
  openInNewTab: (entity: TKeyboardNavEntity) => void;
  toggleSelection: (entity: TKeyboardNavEntity) => void;
  scrollToEntity: (entity: TKeyboardNavEntity) => void;
};

/**
 * @description The KeyboardNavStore drives work-item list navigation from the
 * keyboard (linear-style `j` / `k` / `o`). Layouts feed it the ordered list of
 * entity ids they render; the store owns the cursor position so single-key
 * commands in the power-k registry stay globally registered and just consult it.
 *
 * The cursor is index-based so the position survives list reshuffles (filters,
 * grouping changes, pagination) without additional bookkeeping.
 */
export type IKeyboardNavStore = {
  // observables
  orderedEntities: TKeyboardNavEntity[];
  cursorIndex: number | null;
  // helper actions
  getIsEntityFocused: (entityID: string) => boolean;
  getFocusedEntity: () => TKeyboardNavEntity | null;
  hasOrderedEntities: () => boolean;
  hasManagers: () => boolean;
  // entity actions
  setOrderedEntities: (entities: TKeyboardNavEntity[]) => void;
  setManagers: (managers: TKeyboardNavManagers | null) => void;
  focusEntity: (entityID: string) => void;
  moveCursor: (direction: "up" | "down") => TKeyboardNavEntity | null;
  openFocusedEntity: () => void;
  scrollFocusedEntity: () => void;
  toggleFocusedSelection: () => void;
  openFocusedEntityInNewTab: () => void;
  resetCursor: () => void;
  clear: () => void;
};

export class KeyboardNavStore implements IKeyboardNavStore {
  // observables
  orderedEntities: TKeyboardNavEntity[] = [];
  cursorIndex: number | null = null;
  // managers registered by the active layout (not observable - callbacks only)
  managers: TKeyboardNavManagers | null = null;

  constructor() {
    makeObservable(this, {
      orderedEntities: observable,
      cursorIndex: observable,
      setOrderedEntities: action,
      setManagers: action,
      focusEntity: action,
      moveCursor: action,
      resetCursor: action,
      clear: action,
    });
  }

  /**
   * @description returns if the entity currently holds the keyboard cursor
   * @param {string} entityID
   * @returns {boolean}
   */
  getIsEntityFocused = (entityID: string): boolean => this.getFocusedEntity()?.entityID === entityID;

  /**
   * @description returns the entity the keyboard cursor currently points at
   * @returns {TKeyboardNavEntity | null}
   */
  getFocusedEntity = (): TKeyboardNavEntity | null => {
    if (this.cursorIndex === null) return null;
    return this.orderedEntities[this.cursorIndex] ?? null;
  };

  /**
   * @description whether a layout currently renders navigable entities
   * @returns {boolean}
   */
  hasOrderedEntities = (): boolean => this.orderedEntities.length > 0;

  /**
   * @description whether a layout registered its keyboard-nav managers
   * @returns {boolean}
   */
  hasManagers = (): boolean => this.managers !== null;

  /**
   * @description feed the ordered list of rendered entities (render order)
   * @param {TKeyboardNavEntity[]} entities
   */
  setOrderedEntities = (entities: TKeyboardNavEntity[]): void => {
    runInAction(() => {
      this.orderedEntities = entities;
      // keep the cursor within bounds; drop it when the list empties
      if (entities.length === 0) {
        this.cursorIndex = null;
      } else if (this.cursorIndex !== null && this.cursorIndex >= entities.length) {
        this.cursorIndex = entities.length - 1;
      }
    });
  };

  /**
   * @description register the active layout's open/select callbacks
   * @param {TKeyboardNavManagers | null} managers
   */
  setManagers = (managers: TKeyboardNavManagers | null): void => {
    this.managers = managers;
  };

  /**
   * @description move the cursor onto a specific entity
   * @param {string} entityID
   */
  focusEntity = (entityID: string): void => {
    runInAction(() => {
      const index = this.orderedEntities.findIndex((entity) => entity.entityID === entityID);
      this.cursorIndex = index === -1 ? null : index;
    });
  };

  /**
   * @description move the cursor up/down the rendered order, jumping to the
   * first/last entity when the cursor is not yet placed
   * @param {"up" | "down"} direction
   * @returns {TKeyboardNavEntity | null} the entity the cursor landed on
   */
  moveCursor = (direction: "up" | "down"): TKeyboardNavEntity | null => {
    if (this.orderedEntities.length === 0) return null;

    return runInAction(() => {
      if (this.cursorIndex === null) {
        this.cursorIndex = direction === "down" ? 0 : this.orderedEntities.length - 1;
        return this.orderedEntities[this.cursorIndex];
      }

      const nextIndex =
        direction === "down"
          ? Math.min(this.cursorIndex + 1, this.orderedEntities.length - 1)
          : Math.max(this.cursorIndex - 1, 0);

      this.cursorIndex = nextIndex;
      return this.orderedEntities[nextIndex];
    });
  };

  /**
   * @description open the focused entity through the active layout
   */
  openFocusedEntity = (): void => {
    const entity = this.getFocusedEntity();
    if (entity) this.managers?.openEntity(entity);
  };

  /**
   * @description keep the focused entity inside the scroll container
   */
  scrollFocusedEntity = (): void => {
    const entity = this.getFocusedEntity();
    if (entity) this.managers?.scrollToEntity(entity);
  };

  /**
   * @description toggle multi-select on the focused entity through the active layout
   */
  toggleFocusedSelection = (): void => {
    const entity = this.getFocusedEntity();
    if (entity) this.managers?.toggleSelection(entity);
  };

  /**
   * @description open the focused entity in a new browser tab
   */
  openFocusedEntityInNewTab = (): void => {
    const entity = this.getFocusedEntity();
    if (entity) this.managers?.openInNewTab(entity);
  };

  /**
   * @description drop the cursor position while keeping the rendered order
   */
  resetCursor = (): void => {
    runInAction(() => {
      this.cursorIndex = null;
    });
  };

  /**
   * @description reset the cursor, the rendered-entity snapshot and the layout managers
   */
  clear = (): void => {
    runInAction(() => {
      this.orderedEntities = [];
      this.cursorIndex = null;
      this.managers = null;
    });
  };
}
