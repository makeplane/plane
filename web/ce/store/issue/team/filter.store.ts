import { IProjectIssuesFilter, ProjectIssuesFilter } from "@/store/issue/project";
import { IIssueRootStore } from "@/store/issue/root.store";

// @ts-nocheck - This class will never be used, extending similar class to avoid type errors
export type ITeamIssuesFilter = IProjectIssuesFilter;

// @ts-nocheck - This class will never be used, extending similar class to avoid type errors
export class TeamIssuesFilter extends ProjectIssuesFilter implements IProjectIssuesFilter {
  constructor(_rootStore: IIssueRootStore) {
    super(_rootStore);
  }
}
