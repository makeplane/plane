import set from "lodash/set";
import { action, makeObservable, observable, runInAction } from "mobx";
// types
import { TBulkOperationsPayload } from "@plane/types";
// hooks
import { TEntityDetails } from "@/hooks/use-multiple-select";
// services
import { IssueService } from "@/services/issue";
import { IIssueRootStore } from "./root.store";

export type IIssueBulkOperationsStore = {
  // observables
  selectedEntityDetails: TEntityDetails[];
  lastSelectedEntityDetails: TEntityDetails | null;
  previousActiveEntity: TEntityDetails | null;
  nextActiveEntity: TEntityDetails | null;
  activeEntityDetails: TEntityDetails | null;
  // helper actions
  isEntitySelected: (entityID: string) => boolean;
  isEntityActive: (entityID: string) => boolean;
  // entity actions
  updateSelectedEntityDetails: (entityDetails: TEntityDetails, action: "add" | "remove") => void;
  updateLastSelectedEntityDetails: (entityDetails: TEntityDetails | null) => void;
  updatePreviousActiveEntity: (entityDetails: TEntityDetails | null) => void;
  updateNextActiveEntity: (entityDetails: TEntityDetails | null) => void;
  updateActiveEntityDetails: (entityDetails: TEntityDetails | null) => void;
  clearSelection: () => void;
  // bulk ops actions
  bulkUpdateProperties: (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => Promise<void>;
};

export class IssueBulkOperationsStore implements IIssueBulkOperationsStore {
  // observables
  selectedEntityDetails: TEntityDetails[] = [];
  lastSelectedEntityDetails: TEntityDetails | null = null;
  previousActiveEntity: TEntityDetails | null = null;
  nextActiveEntity: TEntityDetails | null = null;
  activeEntityDetails: TEntityDetails | null = null;
  // root store
  rootIssueStore: IIssueRootStore;
  // service
  issueService;

  constructor(_rootStore: IIssueRootStore) {
    makeObservable(this, {
      // observables
      selectedEntityDetails: observable,
      lastSelectedEntityDetails: observable,
      previousActiveEntity: observable,
      nextActiveEntity: observable,
      activeEntityDetails: observable,
      // entity actions
      updateSelectedEntityDetails: action,
      updateLastSelectedEntityDetails: action,
      updatePreviousActiveEntity: action,
      updateNextActiveEntity: action,
      updateActiveEntityDetails: action,
      clearSelection: action,
      // bulk ops actions
      bulkUpdateProperties: action,
    });

    this.rootIssueStore = _rootStore;
    this.issueService = new IssueService();
  }

  // helper actions
  /**
   * @description returns if the entity is selected or not
   * @param {string} entityID
   * @returns {boolean}
   */
  isEntitySelected = (entityID: string): boolean => this.selectedEntityDetails.some((en) => en.entityID === entityID);

  /**
   * @description returns if the entity is active or not
   * @param {string} entityID
   * @returns {boolean}
   */
  isEntityActive = (entityID: string): boolean => this.activeEntityDetails?.entityID === entityID;

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

  /**
   * @description bulk update properties of selected issues
   * @param {TBulkOperationsPayload} data
   */
  bulkUpdateProperties = async (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => {
    const issueIds = data.issue_ids;
    // keep original data to rollback in case of error
    const originalData: Record<string, any> = {};
    try {
      runInAction(() => {
        issueIds.forEach((issueId) => {
          const issueDetails = this.rootIssueStore.issues.getIssueById(issueId);
          if (!issueDetails) throw new Error("Issue not found");
          Object.keys(data.properties).forEach((key) => {
            const property = key as keyof TBulkOperationsPayload["properties"];
            // update backup data
            set(originalData, [issueId, property], issueDetails[property]);
            // update root issue map properties
            this.rootIssueStore.issues.updateIssue(issueId, {
              [property]: data.properties[property],
            });
          });
        });
      });
      // make request to update issue properties
      await this.issueService.bulkOperations(workspaceSlug, projectId, data);
    } catch (error) {
      // rollback changes
      runInAction(() => {
        issueIds.forEach((issueId) => {
          Object.keys(data.properties).forEach((key) => {
            const property = key as keyof TBulkOperationsPayload["properties"];
            // revert root issue map properties
            this.rootIssueStore.issues.updateIssue(issueId, {
              [property]: originalData[issueId][property],
            });
          });
        });
      });
      throw error;
    }
  };
}
