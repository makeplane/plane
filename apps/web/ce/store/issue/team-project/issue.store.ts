import { IProjectIssues, ProjectIssues } from "@/store/issue/project";
import { IIssueRootStore } from "@/store/issue/root.store";
import { ITeamProjectWorkItemsFilter } from "./filter.store";

// @ts-nocheck - This class will never be used, extending similar class to avoid type errors
export type ITeamProjectWorkItems = IProjectIssues;

// @ts-nocheck - This class will never be used, extending similar class to avoid type errors
export class TeamProjectWorkItems extends ProjectIssues implements ITeamProjectWorkItems {
  constructor(_rootStore: IIssueRootStore, teamProjectWorkItemsFilterStore: ITeamProjectWorkItemsFilter) {
    super(_rootStore, teamProjectWorkItemsFilterStore);
  }
}
