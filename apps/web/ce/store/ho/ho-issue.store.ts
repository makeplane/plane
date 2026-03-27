import { makeObservable, observable, action, runInAction } from "mobx";
import type { THoIssue, THoCategorySummary } from "@/plane-web/services/ho-issue.service";
import { HoIssueService } from "@/plane-web/services/ho-issue.service";

/** Returns today as YYYY-MM-DD in local time. */
function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export type THoDisplayProperties = Record<string, boolean>;

// All 18 display columns enabled by default
const HO_DEFAULT_DISPLAY_PROPERTIES: THoDisplayProperties = {
  department_name: true,
  project_name: true,
  main_task_category: true,
  sub_task_category: true,
  sub_issue_count: true,
  project_lead: true,
  assignee: true,
  bank_wide_project: true,
  priority: true,
  state: true,
  progress_tracking: true,
  modules: true,
  cycle: true,
  start_date: true,
  due_date: true,
  completed_date: true,
  total_log_time: true,
  reference_link: true,
};

export interface IHoIssueStore {
  // Observables
  issues: THoIssue[];
  categorySummary: THoCategorySummary[];
  isLoading: boolean;
  isCategoryLoading: boolean;
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
  updateOrderBy: (key: string) => void;
  setDateRange: (from: string, to: string) => void;
  updateDisplayProperties: (props: Partial<THoDisplayProperties>) => void;
}

export class HoIssueStore implements IHoIssueStore {
  issues: THoIssue[] = [];
  categorySummary: THoCategorySummary[] = [];
  isLoading = false;
  isCategoryLoading = false;
  error: string | null = null;
  currentPage = 1;
  totalCount = 0;
  nextPageUrl: string | null = null;
  orderBy = "project__workspace__name";
  fromDate: string = todayISO();
  toDate: string = todayISO();
  displayProperties: THoDisplayProperties = { ...HO_DEFAULT_DISPLAY_PROPERTIES };

  private service: HoIssueService;

  constructor() {
    this.service = new HoIssueService();
    makeObservable(this, {
      issues: observable,
      categorySummary: observable,
      isLoading: observable,
      isCategoryLoading: observable,
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
      updateOrderBy: action,
      setDateRange: action,
      updateDisplayProperties: action,
    });
  }

  fetchIssues = async (page = 1): Promise<void> => {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });
    try {
      const params: Record<string, string> = {
        page: String(page),
        order_by: this.orderBy,
        from_date: this.fromDate,
        to_date: this.toDate,
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
      const params: Record<string, string> = {
        from_date: this.fromDate,
        to_date: this.toDate,
      };
      const data = await this.service.getCategorySummary(params);
      runInAction(() => {
        this.categorySummary = data;
      });
    } catch {
      // leave existing data intact on error
    } finally {
      runInAction(() => {
        this.isCategoryLoading = false;
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
    void this.fetchIssues(1);
    void this.fetchCategorySummary();
  };

  updateDisplayProperties = (props: Partial<THoDisplayProperties>): void => {
    this.displayProperties = { ...this.displayProperties, ...props };
  };
}
