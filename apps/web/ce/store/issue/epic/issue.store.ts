import type { IProjectIssues } from "@/store/issue/project";
import { ProjectIssues } from "@/store/issue/project";
import type { IIssueRootStore } from "@/store/issue/root.store";
import type { IProjectEpicsFilter } from "./filter.store";

// @ts-nocheck - This class will never be used, extending similar class to avoid type errors

export type IProjectEpics = IProjectIssues;

// @ts-nocheck - This class will never be used, extending similar class to avoid type errors
export class ProjectEpics extends ProjectIssues implements IProjectEpics {
  constructor(_rootStore: IIssueRootStore, issueFilterStore: IProjectEpicsFilter) {
    super(_rootStore, issueFilterStore);
  }
}
