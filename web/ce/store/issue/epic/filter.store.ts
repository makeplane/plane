import { IProjectIssuesFilter, ProjectIssuesFilter } from "@/store/issue/project";
import { IIssueRootStore } from "@/store/issue/root.store";

// @ts-nocheck - This class will never be used, extending similar class to avoid type errors
export type IProjectEpicsFilter = IProjectIssuesFilter;

// @ts-nocheck - This class will never be used, extending similar class to avoid type errors
export class ProjectEpicsFilter extends ProjectIssuesFilter implements IProjectEpicsFilter {
  constructor(_rootStore: IIssueRootStore) {
    super(_rootStore);

    // root store
    this.rootIssueStore = _rootStore;
  }
}
