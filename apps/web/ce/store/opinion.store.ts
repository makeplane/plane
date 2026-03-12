import { action, makeObservable, observable, runInAction, set } from "mobx";
import type { TIssueOpinion, TIssueOpinionByActivityMap, TIssueOpinionCreate } from "@plane/types";
import { issueOpinionService } from "../services/issue-opinion.service";

export class OpinionStore {
  /** activityId → opinion (if exists) */
  opinionByActivity: TIssueOpinionByActivityMap = {};
  /** issueId → loading state */
  loader: Record<string, boolean> = {};

  constructor() {
    makeObservable(this, {
      opinionByActivity: observable,
      loader: observable,
      fetchOpinionsForIssue: action,
      upsertOpinion: action,
      deleteOpinion: action,
    });
  }

  getOpinionForActivity(activityId: string): TIssueOpinion | undefined {
    return this.opinionByActivity[activityId];
  }

  isLoading(issueId: string): boolean {
    return this.loader[issueId] ?? false;
  }

  /** Batch-load all opinions for an issue (call once when activity feed mounts) */
  async fetchOpinionsForIssue(slug: string, projectId: string, issueId: string): Promise<void> {
    try {
      runInAction(() => {
        set(this.loader, issueId, true);
      });
      const data = await issueOpinionService.listOpinionsForIssue(slug, projectId, issueId);
      runInAction(() => {
        Object.entries(data).forEach(([activityId, opinion]) => {
          set(this.opinionByActivity, activityId, opinion);
        });
        set(this.loader, issueId, false);
      });
    } catch {
      runInAction(() => {
        set(this.loader, issueId, false);
      });
    }
  }

  async upsertOpinion(
    slug: string,
    projectId: string,
    issueId: string,
    activityId: string,
    payload: TIssueOpinionCreate
  ): Promise<TIssueOpinion> {
    const opinion = await issueOpinionService.upsertOpinion(slug, projectId, issueId, activityId, payload);
    runInAction(() => {
      set(this.opinionByActivity, activityId, opinion);
    });
    return opinion;
  }

  async deleteOpinion(
    slug: string,
    projectId: string,
    issueId: string,
    activityId: string,
    opinionId: string
  ): Promise<void> {
    await issueOpinionService.deleteOpinion(slug, projectId, issueId, activityId, opinionId);
    runInAction(() => {
      set(this.opinionByActivity, activityId, undefined);
    });
  }
}
