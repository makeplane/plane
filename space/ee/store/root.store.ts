// plane web stores
import { IPagesListStore, PagesListStore } from "@/plane-web/store/pages";
// store
import { CoreRootStore } from "@/store/root.store";
import { FeatureFlagsStore, IFeatureFlagsStore } from "./feature_flags.store";
import { IIntakeStore, IntakeStore } from "./intake.store";
import { CalendarStore, ICalendarStore } from "./issue_calendar_view.store";
import { ProjectViewStore } from "./views/project-view.store";
import { IViewIssueFilterStore, ViewIssueFilterStore } from "./views/view-issue-filters.store";
import { IViewIssueStore, ViewIssueStore } from "./views/view-issues.store";

export class RootStore extends CoreRootStore {
  pagesListStore: IPagesListStore;
  projectViewStore: ProjectViewStore;
  viewIssues: IViewIssueStore;
  viewIssuesFilter: IViewIssueFilterStore;
  calendarStore: ICalendarStore;
  intakeStore: IIntakeStore;
  featureFlagsStore: IFeatureFlagsStore;

  constructor() {
    super();
    this.pagesListStore = new PagesListStore(this);
    this.projectViewStore = new ProjectViewStore(this);
    this.viewIssues = new ViewIssueStore(this);
    this.viewIssuesFilter = new ViewIssueFilterStore(this);
    this.calendarStore = new CalendarStore();
    this.intakeStore = new IntakeStore();
    this.featureFlagsStore = new FeatureFlagsStore();
  }

  reset() {
    super.reset();
    this.pagesListStore = new PagesListStore(this);
    this.projectViewStore = new ProjectViewStore(this);
    this.viewIssues = new ViewIssueStore(this);
    this.viewIssuesFilter = new ViewIssueFilterStore(this);
    this.calendarStore = new CalendarStore();
    this.intakeStore = new IntakeStore();
    this.featureFlagsStore = new FeatureFlagsStore();
  }
}
