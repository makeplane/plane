import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// hooks
import { TEntityDetails } from "@/hooks/use-multiple-select";
// services
import { IssueService } from "@/services/issue";

export type IMultipleSelectStore = {
  // observables
  isSelectionActive: boolean;
  selectedEntityIds: string[];
  // helper actions
  isEntitySelected: (entityID: string) => boolean;
  isEntityActive: (entityID: string) => boolean;
  getLastSelectedEntityDetails: () => TEntityDetails | null;
  getPreviousActiveEntity: () => TEntityDetails | null;
  getNextActiveEntity: () => TEntityDetails | null;
  getActiveEntityDetails: () => TEntityDetails | null;
  // entity actions
  updateSelectedEntityDetails: (entityDetails: TEntityDetails, action: "add" | "remove") => void;
  updateLastSelectedEntityDetails: (entityDetails: TEntityDetails | null) => void;
  updatePreviousActiveEntity: (entityDetails: TEntityDetails | null) => void;
  updateNextActiveEntity: (entityDetails: TEntityDetails | null) => void;
  updateActiveEntityDetails: (entityDetails: TEntityDetails | null) => void;
  clearSelection: () => void;
};

export class MultipleSelectStore implements IMultipleSelectStore {
  // observables
  selectedEntityDetails: TEntityDetails[] = [];
  lastSelectedEntityDetails: TEntityDetails | null = null;
  previousActiveEntity: TEntityDetails | null = null;
  nextActiveEntity: TEntityDetails | null = null;
  activeEntityDetails: TEntityDetails | null = null;
  // service
  issueService;

  constructor() {
    makeObservable(this, {
      // observables
      selectedEntityDetails: observable,
      lastSelectedEntityDetails: observable,
      previousActiveEntity: observable,
      nextActiveEntity: observable,
      activeEntityDetails: observable,
      // entity actions
      isSelectionActive: computed,
      selectedEntityIds: computed,
      updateSelectedEntityDetails: action,
      updateLastSelectedEntityDetails: action,
      updatePreviousActiveEntity: action,
      updateNextActiveEntity: action,
      updateActiveEntityDetails: action,
      clearSelection: action,
    });

    this.issueService = new IssueService();
  }

  get isSelectionActive() {
    return this.selectedEntityDetails.length > 0;
  }

  get selectedEntityIds() {
    return this.selectedEntityDetails.map((en) => en.entityID);
  }

  // helper actions
  /**
   * @description returns if the entity is selected or not
   * @param {string} entityID
   * @returns {boolean}
   */
  isEntitySelected = computedFn((entityID: string): boolean =>
    this.selectedEntityDetails.some((en) => en.entityID === entityID)
  );

  /**
   * @description returns if the entity is active or not
   * @param {string} entityID
   * @returns {boolean}
   */
  isEntityActive = computedFn((entityID: string): boolean => this.activeEntityDetails?.entityID === entityID);

  getLastSelectedEntityDetails = computedFn(() => this.lastSelectedEntityDetails);
  getPreviousActiveEntity = computedFn(() => this.previousActiveEntity);
  getNextActiveEntity = computedFn(() => this.nextActiveEntity);
  getActiveEntityDetails = computedFn(() => this.activeEntityDetails);

  // entity actions
  /**
   * @description add or remove entities
   * @param {TEntityDetails} entityDetails
   * @param {"add" | "remove"} action
   */
  updateSelectedEntityDetails = (entityDetails: TEntityDetails, action: "add" | "remove") => {
    if (action === "add") {
      runInAction(() => {
        if (this.isEntitySelected(entityDetails.entityID)) {
          this.selectedEntityDetails = this.selectedEntityDetails.filter(
            (en) => en.entityID !== entityDetails.entityID
          );
        }
        this.selectedEntityDetails.push(entityDetails);
        this.updateLastSelectedEntityDetails(entityDetails);
      });
    } else {
      let currentSelection = [...this.selectedEntityDetails];
      currentSelection = currentSelection.filter((en) => en.entityID !== entityDetails.entityID);
      runInAction(() => {
        this.selectedEntityDetails = this.selectedEntityDetails.filter((en) => en.entityID !== entityDetails.entityID);
        this.updateLastSelectedEntityDetails(currentSelection[currentSelection.length - 1] ?? null);
      });
    }
  };

  /**
   * @description update last selected entity
   * @param {TEntityDetails} entityDetails
   */
  updateLastSelectedEntityDetails = (entityDetails: TEntityDetails | null) => {
    runInAction(() => {
      this.lastSelectedEntityDetails = entityDetails;
    });
  };

  /**
   * @description update previous active entity
   * @param {TEntityDetails} entityDetails
   */
  updatePreviousActiveEntity = (entityDetails: TEntityDetails | null) => {
    runInAction(() => {
      this.previousActiveEntity = entityDetails;
    });
  };

  /**
   * @description update next active entity
   * @param {TEntityDetails} entityDetails
   */
  updateNextActiveEntity = (entityDetails: TEntityDetails | null) => {
    runInAction(() => {
      this.nextActiveEntity = entityDetails;
    });
  };

  /**
   * @description update active entity
   * @param {TEntityDetails} entityDetails
   */
  updateActiveEntityDetails = (entityDetails: TEntityDetails | null) => {
    runInAction(() => {
      this.activeEntityDetails = entityDetails;
    });
  };

  /**
   * @description clear selection and reset all the observables
   */
  clearSelection = () => {
    runInAction(() => {
      this.selectedEntityDetails = [];
      this.lastSelectedEntityDetails = null;
      this.previousActiveEntity = null;
      this.nextActiveEntity = null;
      this.activeEntityDetails = null;
    });
  };
}
