import { makeObservable, observable, action, runInAction } from "mobx";
import type {
  THoIssue,
  THoCategorySummary,
  THoAccessibleWorkspace,
  THoFilterOptions,
} from "@/plane-web/services/ho-issue.service";
import { HoIssueService } from "@/plane-web/services/ho-issue.service";
import { todayISO, HO_DEFAULT_DISPLAY_PROPERTIES, type THoDisplayProperties } from "./ho-issue.defaults";

export interface IHoIssueStore {
  // Observables
  issues: THoIssue[];
  categorySummary: THoCategorySummary[];
  accessibleWorkspaces: THoAccessibleWorkspace[];
  filterOptions: THoFilterOptions | null;
  selectedWorkspaceSlug: string | null;
  selectedProjectIds: string[];
  filters: {
    priority: string[];
    state: string[];
    assignees: string[];
    leads: string[];
    main_task_category: string[];
    sub_task_category: string[];
    cycle: string[];
    module: string[];
    bank_wide: boolean | null;
    progress: string[];
  };
  isLoading: boolean;
  isCategoryLoading: boolean;
  isWorkspacesLoading: boolean;
  isFetchingIssues: boolean;
  isFilterOptionsLoading: boolean;
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
  fetchFilterOptions: () => Promise<void>;
  updateOrderBy: (key: string) => void;
  setDateRange: (from: string, to: string) => void;
  updateDisplayProperties: (props: Partial<THoDisplayProperties>) => void;
  setWorkspaceFilter: (slug: string | null) => void;
  setProjectFilter: (ids: string[]) => void;
  updateFilters: (filters: Partial<IHoIssueStore["filters"]>) => void;
  clearFilters: () => void;
}

export class HoIssueStore implements IHoIssueStore {
  issues: THoIssue[] = [];
  categorySummary: THoCategorySummary[] = [];
  accessibleWorkspaces: THoAccessibleWorkspace[] = [];
  filterOptions: THoFilterOptions | null = null;
  selectedWorkspaceSlug: string | null = null;
  selectedProjectIds: string[] = [];
  filters: IHoIssueStore["filters"] = {
    priority: [],
    state: [],
    assignees: [],
    leads: [],
    main_task_category: [],
    sub_task_category: [],
    cycle: [],
    module: [],
    bank_wide: null,
    progress: [],
  };
  isLoading = false;
  isCategoryLoading = false;
  isWorkspacesLoading = false;
  isFetchingIssues = false;
  isFilterOptionsLoading = false;
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
      filterOptions: observable,
      selectedWorkspaceSlug: observable,
      selectedProjectIds: observable,
      filters: observable,
      isLoading: observable,
      isCategoryLoading: observable,
      isWorkspacesLoading: observable,
      isFetchingIssues: observable,
      isFilterOptionsLoading: observable,
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
      fetchFilterOptions: action,
      updateOrderBy: action,
      setDateRange: action,
      updateDisplayProperties: action,
      setWorkspaceFilter: action,
      setProjectFilter: action,
      updateFilters: action,
      clearFilters: action,
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

    // Additional filters
    if (this.filters.priority.length > 0) params.priority = this.filters.priority.join(",");
    if (this.filters.state.length > 0) params.state = this.filters.state.join(",");
    if (this.filters.assignees.length > 0) params.assignees = this.filters.assignees.join(",");
    if (this.filters.leads.length > 0) params.leads = this.filters.leads.join(",");
    if (this.filters.main_task_category.length > 0)
      params.main_task_category = this.filters.main_task_category.join(",");
    if (this.filters.sub_task_category.length > 0) params.sub_task_category = this.filters.sub_task_category.join(",");
    if (this.filters.cycle.length > 0) params.cycle = this.filters.cycle.join(",");
    if (this.filters.module.length > 0) params.module = this.filters.module.join(",");
    if (this.filters.bank_wide !== null) params.bank_wide = String(this.filters.bank_wide);
    if (this.filters.progress.length > 0) params.progress = this.filters.progress.join(",");

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

  fetchFilterOptions = async (): Promise<void> => {
    runInAction(() => {
      this.isFilterOptionsLoading = true;
    });
    try {
      const params = {
        workspace_slug: this.selectedWorkspaceSlug || "",
        project_id: this.selectedProjectIds.join(","),
        from_date: this.fromDate,
        to_date: this.toDate,
      };
      const data = await this.service.listFilterOptions(params);
      runInAction(() => {
        this.filterOptions = data;
      });
    } catch (err) {
      console.error("[HO] fetchFilterOptions failed:", err);
    } finally {
      runInAction(() => {
        this.isFilterOptionsLoading = false;
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
    void this.fetchFilterOptions();
  };

  updateDisplayProperties = (props: Partial<THoDisplayProperties>): void => {
    this.displayProperties = { ...this.displayProperties, ...props } as THoDisplayProperties;
  };

  setWorkspaceFilter = (slug: string | null): void => {
    runInAction(() => {
      this.selectedWorkspaceSlug = slug;
      this.selectedProjectIds = [];
      this.currentPage = 1;
    });
    void this._fetchFiltered();
    void this.fetchFilterOptions();
  };

  setProjectFilter = (ids: string[]): void => {
    runInAction(() => {
      this.selectedProjectIds = ids;
      this.currentPage = 1;
    });
    void this._fetchFiltered();
    void this.fetchFilterOptions();
  };

  updateFilters = (filters: Partial<HoIssueStore["filters"]>): void => {
    runInAction(() => {
      this.filters = { ...this.filters, ...filters };
      this.currentPage = 1;
    });
    void this._fetchFiltered();
  };

  clearFilters = (): void => {
    runInAction(() => {
      this.filters = {
        priority: [],
        state: [],
        assignees: [],
        leads: [],
        main_task_category: [],
        sub_task_category: [],
        cycle: [],
        module: [],
        bank_wide: null,
        progress: [],
      };
      this.currentPage = 1;
    });
    void this._fetchFiltered();
  };
}
