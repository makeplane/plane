import { action, makeObservable, observable, runInAction, set } from "mobx";
// types
import type { IWorkLog } from "@plane/types";
// services
import { CEProjectWorklogService } from "../../services/project-worklog.service";

const PAGE_SIZE = 25;

export class ProjectWorklogStore {
  // states
  worklogs: Record<string, IWorkLog[]> = {}; // projectId -> IWorkLog[]
  isLoading: boolean = false;
  hasMore: boolean = false;
  hasPrev: boolean = false;
  nextCursor?: string = undefined;
  prevCursor?: string = undefined;
  totalCount: number = 0;
  currentPage: number = 1;

  // services
  private worklogService = new CEProjectWorklogService();

  constructor() {
    makeObservable(this, {
      worklogs: observable,
      isLoading: observable,
      hasMore: observable,
      hasPrev: observable,
      nextCursor: observable,
      prevCursor: observable,
      totalCount: observable,
      currentPage: observable,

      setWorklogs: action,
      setIsLoading: action,
      setPagination: action,

      fetchWorklogs: action,
      fetchPage: action,
      triggerExport: action,
    });
  }

  // Computed display helpers
  get pageSize() {
    return PAGE_SIZE;
  }

  get rangeStart() {
    return (this.currentPage - 1) * PAGE_SIZE + 1;
  }

  get rangeEnd() {
    return Math.min(this.currentPage * PAGE_SIZE, this.totalCount);
  }

  // Setters
  setWorklogs = (projectId: string, data: IWorkLog[]) => {
    set(this.worklogs, projectId, data);
  };

  setIsLoading = (state: boolean) => {
    this.isLoading = state;
  };

  setPagination = (hasMore: boolean, nextCursor?: string, prevCursor?: string, totalCount?: number) => {
    this.hasMore = hasMore;
    this.nextCursor = nextCursor;
    this.hasPrev = !!prevCursor;
    this.prevCursor = prevCursor;
    if (totalCount !== undefined) this.totalCount = totalCount;
  };

  // Actions
  fetchWorklogs = async (
    workspaceSlug: string,
    projectId: string,
    params?: Record<string, string>,
    cursor?: string
  ) => {
    if (this.isLoading) return;
    this.setIsLoading(true);

    try {
      const response = await this.worklogService.getProjectWorklogs(workspaceSlug, projectId, cursor, params);

      runInAction(() => {
        const items: IWorkLog[] = response.results || [];
        const hasNextPage = !!response.next_page_results;
        const next = response.next_cursor || undefined;
        const prev = response.prev_cursor || undefined;
        const total = response.total_count ?? 0;

        this.setPagination(hasNextPage, next, prev, total);
        this.setWorklogs(projectId, items);

        // Reset page to 1 when no cursor (fresh fetch / filter change)
        if (!cursor) this.currentPage = 1;

        this.setIsLoading(false);
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.setIsLoading(false);
        this.setWorklogs(projectId, []);
      });
      console.error("Failed to fetch worklogs", error);
      throw error;
    }
  };

  fetchPage = async (
    workspaceSlug: string,
    projectId: string,
    direction: "next" | "prev",
    params?: Record<string, string>
  ) => {
    const cursor = direction === "next" ? this.nextCursor : this.prevCursor;
    if (!cursor) return;

    await this.fetchWorklogs(workspaceSlug, projectId, params, cursor);
    runInAction(() => {
      this.currentPage += direction === "next" ? 1 : -1;
    });
  };

  triggerExport = async (
    workspaceSlug: string,
    projectId: string,
    provider: "csv" | "xlsx",
    filters?: Record<string, string>
  ) => {
    return this.worklogService.triggerExport(workspaceSlug, projectId, provider, filters);
  };
}
