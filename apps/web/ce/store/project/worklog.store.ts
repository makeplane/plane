import { action, makeObservable, observable, runInAction, set } from "mobx";
// types
import type { IWorkLog } from "@plane/types";
// services
import { CEProjectWorklogService } from "../../services/project-worklog.service";

export class ProjectWorklogStore {
  // states
  worklogs: Record<string, IWorkLog[]> = {}; // projectId -> IWorkLog[]
  isLoading: boolean = false;
  hasMore: boolean = false;
  nextCursor?: string = undefined;

  // services
  private worklogService = new CEProjectWorklogService();

  constructor() {
    makeObservable(this, {
      worklogs: observable,
      isLoading: observable,
      hasMore: observable,
      nextCursor: observable,

      setWorklogs: action,
      setIsLoading: action,
      setPagination: action,

      fetchWorklogs: action,
    });
  }

  // Setters
  setWorklogs = (projectId: string, data: IWorkLog[]) => {
    set(this.worklogs, projectId, data);
  };

  setIsLoading = (state: boolean) => {
    this.isLoading = state;
  };

  setPagination = (hasMore: boolean, cursor?: string) => {
    this.hasMore = hasMore;
    this.nextCursor = cursor;
  };

  // Actions
  fetchWorklogs = async (
    workspaceSlug: string,
    projectId: string,
    params?: Record<string, string>,
    loadMore: boolean = false
  ) => {
    if (this.isLoading && loadMore) return;
    this.setIsLoading(true);

    try {
      const response = await this.worklogService.getProjectWorklogs(
        workspaceSlug,
        projectId,
        loadMore ? this.nextCursor : undefined,
        params
      );

      runInAction(() => {
        const items: IWorkLog[] = response.results || [];
        const hasNextPage = !!response.next_page_results;
        const cursor = response.next_cursor || undefined;

        this.setPagination(hasNextPage, cursor);

        if (loadMore) {
          const existing = this.worklogs[projectId] || [];
          this.setWorklogs(projectId, [...existing, ...items]);
        } else {
          this.setWorklogs(projectId, items);
        }
        this.setIsLoading(false);
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.setIsLoading(false);
        if (!loadMore) {
          this.setWorklogs(projectId, []);
        }
      });
      console.error("Failed to fetch worklogs", error);
      throw error;
    }
  };
}
