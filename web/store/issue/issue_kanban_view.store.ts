import { action, computed, makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
import { IssueRootStore } from "./root.store";
// types

export interface IIssueKanBanViewStore {
  kanBanToggle: {
    groupByHeaderMinMax: string[];
    subgroupByIssuesVisibility: string[];
  };
  // computed
  getCanUserDragDrop: (group_by: string | null, sub_group_by: string | null) => boolean;
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
      canUserDragDropVertically: computed,
      canUserDragDropHorizontally: computed,

      // actions
      handleKanBanToggle: action,
    });

    this.rootStore = _rootStore;
  }

  getCanUserDragDrop = computedFn((group_by: string | null, sub_group_by: string | null) => {
    if (group_by && ["state", "priority"].includes(group_by)) {
      if (!sub_group_by) return true;
      if (sub_group_by && ["state", "priority"].includes(sub_group_by)) return true;
    }
    return false;
  });

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
