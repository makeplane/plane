import { makeObservable, observable, action, runInAction } from "mobx";
import type { THoIssue, THoCategorySummary, THoAccessibleWorkspace } from "@/plane-web/services/ho-issue.service";
import { HoIssueService } from "@/plane-web/services/ho-issue.service";
import { todayISO, HO_DEFAULT_DISPLAY_PROPERTIES, type THoDisplayProperties } from "./ho-issue.defaults";

export interface IHoIssueStore {
  // Observables
  issues: THoIssue[];
  categorySummary: THoCategorySummary[];
  accessibleWorkspaces: THoAccessibleWorkspace[];
  selectedWorkspaceSlug: string | null;
  selectedProjectIds: string[];
  isLoading: boolean;
  isCategoryLoading: boolean;
  isWorkspacesLoading: boolean;
  isFetchingIssues: boolean;
  error: string | null;
  currentPage: number;
  totalCount: number;
  nextPageUrl: string | null;
  orderBy: string;
  fromDate: string;
  toDate: string;
  displayProperties: THoDisplayProperties;
  // Actions
  fetchIssues: (page?: number) => Promise<void>;
  fetchNextPage: () => Promise<void>;
  fetchCategorySummary: () => Promise<void>;
  fetchAccessibleWorkspaces: () => Promise<void>;
  updateOrderBy: (key: string) => void;
  setDateRange: (from: string, to: string) => void;
  updateDisplayProperties: (props: Partial<THoDisplayProperties>) => void;
  setWorkspaceFilter: (slug: string | null) => void;
  setProjectFilter: (ids: string[]) => void;
}

export class HoIssueStore implements IHoIssueStore {
  issues: THoIssue[] = [];
  categorySummary: THoCategorySummary[] = [];
  accessibleWorkspaces: THoAccessibleWorkspace[] = [];
  selectedWorkspaceSlug: string | null = null;
  selectedProjectIds: string[] = [];
  isLoading = false;
  isCategoryLoading = false;
  isWorkspacesLoading = false;
  isFetchingIssues = false;
  error: string | null = null;
  currentPage = 1;
  totalCount = 0;
  nextPageUrl: string | null = null;
  orderBy = "project__workspace__name";
  fromDate: string = todayISO();
  toDate: string = todayISO();
  displayProperties: THoDisplayProperties = { ...HO_DEFAULT_DISPLAY_PROPERTIES };

  private _filterSeq = 0;
  private service: HoIssueService;

  constructor() {
    this.service = new HoIssueService();
    makeObservable(this, {
      issues: observable,
      categorySummary: observable,
      accessibleWorkspaces: observable,
      selectedWorkspaceSlug: observable,
      selectedProjectIds: observable,
      isLoading: observable,
      isCategoryLoading: observable,
      isWorkspacesLoading: observable,
      isFetchingIssues: observable,
      error: observable,
      currentPage: observable,
      totalCount: observable,
      nextPageUrl: observable,
      orderBy: observable,
      fromDate: observable,
      toDate: observable,
      displayProperties: observable,
      fetchIssues: action,
      fetchNextPage: action,
      fetchCategorySummary: action,
      fetchAccessibleWorkspaces: action,
      updateOrderBy: action,
      setDateRange: action,
      updateDisplayProperties: action,
      setWorkspaceFilter: action,
      setProjectFilter: action,
    });
  }

  private _filterParams = (): Record<string, string> => {
    const params: Record<string, string> = {
      order_by: this.orderBy,
      from_date: this.fromDate,
      to_date: this.toDate,
    };
    if (this.selectedWorkspaceSlug) params.workspace_slug = this.selectedWorkspaceSlug;
    if (this.selectedProjectIds.length > 0) params.project_id = this.selectedProjectIds.join(",");
    return params;
  };

  private _fetchFiltered = async (): Promise<void> => {
    const seq = ++this._filterSeq;
    runInAction(() => {
      this.isFetchingIssues = true;
    });
    try {
      const [issues, summary] = await Promise.all([
        this.service.listIssues({ page: "1", ...this._filterParams() }),
        this.service.getCategorySummary(this._filterParams()),
      ]);
      if (seq !== this._filterSeq) return;
      runInAction(() => {
        this.issues = issues.results;
        this.totalCount = issues.count;
        this.nextPageUrl = issues.next;
        this.currentPage = 1;
        this.categorySummary = summary;
        this.isFetchingIssues = false;
      });
    } catch {
      if (seq !== this._filterSeq) return;
      runInAction(() => {
        this.isFetchingIssues = false;
      });
    }
  };

  fetchIssues = async (page = 1): Promise<void> => {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });
    try {
      const params: Record<string, string> = {
        page: String(page),
        ...this._filterParams(),
      };
      const res = await this.service.listIssues(params);
      runInAction(() => {
        this.issues = page === 1 ? res.results : [...this.issues, ...res.results];
        this.totalCount = res.count;
        this.nextPageUrl = res.next;
        this.currentPage = page;
      });
    } catch (_err) {
      runInAction(() => {
        this.error = "Failed to load issues.";
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  fetchNextPage = async (): Promise<void> => {
    if (!this.nextPageUrl) return;
    await this.fetchIssues(this.currentPage + 1);
  };

  fetchCategorySummary = async (): Promise<void> => {
    runInAction(() => {
      this.isCategoryLoading = true;
    });
    try {
      const data = await this.service.getCategorySummary(this._filterParams());
      runInAction(() => {
        this.categorySummary = data;
      });
    } catch {
      // non-critical
    } finally {
      runInAction(() => {
        this.isCategoryLoading = false;
      });
    }
  };

  fetchAccessibleWorkspaces = async (): Promise<void> => {
    if (this.isWorkspacesLoading || this.accessibleWorkspaces.length > 0) return;
    runInAction(() => {
      this.isWorkspacesLoading = true;
    });
    try {
      const data = await this.service.listAccessibleWorkspaces();
      runInAction(() => {
        this.accessibleWorkspaces = data;
      });
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 401 || status === 403) {
        console.error("[HO] fetchAccessibleWorkspaces: auth error", status);
      } else {
        console.error("[HO] fetchAccessibleWorkspaces failed:", err);
      }
    } finally {
      runInAction(() => {
        this.isWorkspacesLoading = false;
      });
    }
  };

  updateOrderBy = (key: string): void => {
    this.orderBy = key;
    void this.fetchIssues(1);
  };

  setDateRange = (from: string, to: string): void => {
    this.fromDate = from;
    this.toDate = to;
    this.currentPage = 1;
    void this._fetchFiltered();
  };

  updateDisplayProperties = (props: Partial<THoDisplayProperties>): void => {
    this.displayProperties = { ...this.displayProperties, ...props };
  };

  setWorkspaceFilter = (slug: string | null): void => {
    runInAction(() => {
      this.selectedWorkspaceSlug = slug;
      this.selectedProjectIds = [];
      this.currentPage = 1;
    });
    void this._fetchFiltered();
  };

  setProjectFilter = (ids: string[]): void => {
    runInAction(() => {
      this.selectedProjectIds = ids;
      this.currentPage = 1;
    });
    void this._fetchFiltered();
  };
}
