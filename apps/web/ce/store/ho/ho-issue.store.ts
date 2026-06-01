import { makeObservable, observable, computed, action, runInAction } from "mobx";
import type {
  THoIssue,
  THoCategorySummary,
  THoAccessibleWorkspace,
  THoFilterOptions,
} from "@/plane-web/services/ho-issue.service";
import { HoIssueService } from "@/plane-web/services/ho-issue.service";
import { todayISO, HO_DEFAULT_DISPLAY_PROPERTIES, type THoDisplayProperties } from "./ho-issue.defaults";

const SHOW_ARCHIVED_STORAGE_KEY = "ho-datasheet:show-archived";

const loadShowArchived = (): boolean => {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(SHOW_ARCHIVED_STORAGE_KEY);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return true;
};

export interface IHoIssueStore {
  // Observables
  issues: THoIssue[];
  categorySummary: THoCategorySummary[];
  accessibleWorkspaces: THoAccessibleWorkspace[];
  filterOptions: THoFilterOptions | null;
  // Computed: workspaces the user can access (shown as department selector options)
  departmentOptions: { id: string; name: string }[];
  selectedDepartmentIds: string[];
  selectedProjectIds: string[];
  filters: {
    priority: string[];
    state: string[];
    assignees: string[];
    leads: string[];
    department: string[];
    main_task_category: string[];
    sub_task_category: string[];
    cycle: string[];
    module: string[];
    bank_wide: string | null;
    progress: string[];
  };
  isLoading: boolean;
  isCategoryLoading: boolean;
  isWorkspacesLoading: boolean;
  isFetchingIssues: boolean;
  isFilterOptionsLoading: boolean;
  filterParams: Record<string, string>;
  exportParams: Record<string, string>;
  error: string | null;
  currentPage: number;
  totalCount: number;
  nextPageUrl: string | null;
  orderBy: string;
  fromDate: string;
  toDate: string;
  showArchived: boolean;
  includeSubIssues: boolean;
  displayProperties: THoDisplayProperties;
  // Actions
  fetchIssues: (page?: number) => Promise<void>;
  fetchNextPage: () => Promise<void>;
  fetchCategorySummary: () => Promise<void>;
  fetchAccessibleWorkspaces: () => Promise<void>;
  fetchFilterOptions: () => Promise<void>;
  updateOrderBy: (key: string) => void;
  setDateRange: (from: string, to: string) => void;
  setShowArchived: (value: boolean) => void;
  setIncludeSubIssues: (value: boolean) => void;
  updateDisplayProperties: (props: Partial<THoDisplayProperties>) => void;
  setDepartmentFilter: (departmentIds: string[]) => void;
  setProjectFilter: (ids: string[]) => void;
  updateFilters: (filters: Partial<IHoIssueStore["filters"]>) => void;
  clearFilters: () => void;
}

export class HoIssueStore implements IHoIssueStore {
  issues: THoIssue[] = [];
  categorySummary: THoCategorySummary[] = [];
  accessibleWorkspaces: THoAccessibleWorkspace[] = [];
  filterOptions: THoFilterOptions | null = null;
  selectedDepartmentIds: string[] = [];
  selectedProjectIds: string[] = [];
  filters: IHoIssueStore["filters"] = {
    priority: [],
    state: [],
    assignees: [],
    leads: [],
    department: [],
    main_task_category: [],
    sub_task_category: [],
    cycle: [],
    module: [],
    bank_wide: null,
    progress: [],
  };
  isLoading = false;
  isCategoryLoading = true;
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
  showArchived = loadShowArchived();
  includeSubIssues = false;
  displayProperties: THoDisplayProperties = { ...HO_DEFAULT_DISPLAY_PROPERTIES };

  private _filterSeq = 0;
  private _filterOptionsInflight: Promise<void> | null = null;
  private service: HoIssueService;

  // Workspaces the user is a member of — shown as dropdown options; value=workspace id
  get departmentOptions(): { id: string; name: string }[] {
    return this.accessibleWorkspaces
      .map((w) => ({ id: w.id, name: w.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  constructor() {
    this.service = new HoIssueService();
    makeObservable(this, {
      issues: observable,
      categorySummary: observable,
      accessibleWorkspaces: observable,
      filterOptions: observable,
      departmentOptions: computed,
      selectedDepartmentIds: observable,
      selectedProjectIds: observable,
      filters: observable,
      isLoading: observable,
      isCategoryLoading: observable,
      isWorkspacesLoading: observable,
      isFetchingIssues: observable,
      isFilterOptionsLoading: observable,
      filterParams: computed,
      exportParams: computed,
      error: observable,
      currentPage: observable,
      totalCount: observable,
      nextPageUrl: observable,
      orderBy: observable,
      fromDate: observable,
      toDate: observable,
      showArchived: observable,
      includeSubIssues: observable,
      displayProperties: observable,
      fetchIssues: action,
      fetchNextPage: action,
      fetchCategorySummary: action,
      fetchAccessibleWorkspaces: action,
      fetchFilterOptions: action,
      updateOrderBy: action,
      setDateRange: action,
      setShowArchived: action,
      setIncludeSubIssues: action,
      updateDisplayProperties: action,
      setDepartmentFilter: action,
      setProjectFilter: action,
      updateFilters: action,
      clearFilters: action,
    });
  }

  get filterParams(): Record<string, string> {
    return this._filterParams();
  }

  get exportParams(): Record<string, string> {
    const visibleColumns = Object.entries(this.displayProperties)
      .filter(([, visible]) => visible)
      .map(([key]) => key);
    return { ...this.filterParams, columns: visibleColumns.join(",") };
  }

  private _filterParams = (): Record<string, string> => {
    const params: Record<string, string> = {
      order_by: this.orderBy,
      from_date: this.fromDate,
      to_date: this.toDate,
      include_archived: String(this.showArchived),
      include_sub_issues: String(this.includeSubIssues),
    };
    if (this.selectedDepartmentIds.length > 0) params.workspace_id = this.selectedDepartmentIds.join(",");
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
    if (this.filters.bank_wide !== null) params.bank_wide = this.filters.bank_wide;
    if (this.filters.progress.length > 0) params.progress = this.filters.progress.join(",");

    return params;
  };

  private _fetchFiltered = async (): Promise<void> => {
    const seq = ++this._filterSeq;
    runInAction(() => {
      this.isFetchingIssues = true;
    });
    try {
      const issues = await this.service.listIssues({ page: "1", ...this._filterParams() });
      if (seq !== this._filterSeq) return;
      runInAction(() => {
        this.issues = issues.results;
        this.totalCount = issues.count;
        this.nextPageUrl = issues.next;
        this.currentPage = 1;
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
      // Category summary is always unfiltered — department filtering is done on the frontend
      const data = await this.service.getCategorySummary({});
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

  fetchFilterOptions = (): Promise<void> => {
    // Dedupe: if a request is already in-flight, reuse it.
    if (this._filterOptionsInflight) return this._filterOptionsInflight;

    const doFetch = async (): Promise<void> => {
      runInAction(() => {
        this.isFilterOptionsLoading = true;
      });
      try {
        const params = {
          workspace_id: this.selectedDepartmentIds.join(","),
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
        this._filterOptionsInflight = null;
      }
    };

    this._filterOptionsInflight = doFetch();
    return this._filterOptionsInflight;
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

  setShowArchived = (value: boolean): void => {
    this.showArchived = value;
    this.currentPage = 1;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SHOW_ARCHIVED_STORAGE_KEY, String(value));
    }
    void this._fetchFiltered();
    void this.fetchFilterOptions();
  };

  setIncludeSubIssues = (value: boolean): void => {
    this.includeSubIssues = value;
    this.currentPage = 1;
    void this._fetchFiltered();
  };

  updateDisplayProperties = (props: Partial<THoDisplayProperties>): void => {
    this.displayProperties = { ...this.displayProperties, ...props } as THoDisplayProperties;
  };

  setDepartmentFilter = (departmentIds: string[]): void => {
    runInAction(() => {
      this.selectedDepartmentIds = departmentIds;
      // Drop projects no longer reachable from selected workspaces (or all when none selected)
      if (departmentIds.length > 0) {
        const allowed = new Set(
          this.accessibleWorkspaces
            .filter((w) => departmentIds.includes(w.id))
            .flatMap((w) => w.projects.map((p) => p.id))
        );
        this.selectedProjectIds = this.selectedProjectIds.filter((id) => allowed.has(id));
      }
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
        department: [],
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
