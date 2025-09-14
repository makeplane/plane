import { IProjectIssuesFilter, ProjectIssuesFilter } from "@/store/issue/project";
import { IIssueRootStore } from "@/store/issue/root.store";

// @ts-nocheck - This class will never be used, extending similar class to avoid type errors
export type ITeamProjectWorkItemsFilter = IProjectIssuesFilter;

// @ts-nocheck - This class will never be used, extending similar class to avoid type errors
export class TeamProjectWorkItemsFilter extends ProjectIssuesFilter implements ITeamProjectWorkItemsFilter {
  constructor(_rootStore: IIssueRootStore) {
    super(_rootStore);
  }
}
