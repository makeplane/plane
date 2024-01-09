import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { IssueRootStore } from "./root.store";
// types

export interface IIssueKanBanViewStore {
  kanBanToggle: {
    groupByHeaderMinMax: string[];
    subgroupByIssuesVisibility: string[];
  };
  // computed
  canUserDragDrop: boolean;
  canUserDragDropVertically: boolean;
  canUserDragDropHorizontally: boolean;
  // actions
  handleKanBanToggle: (toggle: "groupByHeaderMinMax" | "subgroupByIssuesVisibility", value: string) => void;
}

export class IssueKanBanViewStore implements IIssueKanBanViewStore {
  kanBanToggle: {
    groupByHeaderMinMax: string[];
    subgroupByIssuesVisibility: string[];
  } = { groupByHeaderMinMax: [], subgroupByIssuesVisibility: [] };
  // root store
  rootStore;

  constructor(_rootStore: IssueRootStore) {
    makeObservable(this, {
      kanBanToggle: observable,
      // computed
      canUserDragDrop: computed,
      canUserDragDropVertically: computed,
      canUserDragDropHorizontally: computed,

      // actions
      handleKanBanToggle: action,
    });

    this.rootStore = _rootStore;
  }

  get canUserDragDrop() {
    return true;
    if (this.rootStore.issueDetail.peekIssue?.issueId) return false;
    // FIXME: uncomment and fix
    // if (
    //   this.rootStore?.issueFilter?.userDisplayFilters?.order_by &&
    //   this.rootStore?.issueFilter?.userDisplayFilters?.order_by === "sort_order" &&
    //   this.rootStore?.issueFilter?.userDisplayFilters?.group_by &&
    //   ["state", "priority"].includes(this.rootStore?.issueFilter?.userDisplayFilters?.group_by)
    // ) {
    //   if (!this.rootStore?.issueFilter?.userDisplayFilters?.sub_group_by) return true;
    //   if (
    //     this.rootStore?.issueFilter?.userDisplayFilters?.sub_group_by &&
    //     ["state", "priority"].includes(this.rootStore?.issueFilter?.userDisplayFilters?.sub_group_by)
    //   )
    //     return true;
    // }
    // return false;
  }

  get canUserDragDropVertically() {
    return false;
  }

  get canUserDragDropHorizontally() {
    return false;
  }

  handleKanBanToggle = (toggle: "groupByHeaderMinMax" | "subgroupByIssuesVisibility", value: string) => {
    this.kanBanToggle = {
      ...this.kanBanToggle,
      [toggle]: this.kanBanToggle[toggle].includes(value)
        ? this.kanBanToggle[toggle].filter((v) => v !== value)
        : [...this.kanBanToggle[toggle], value],
    };
  };
}
