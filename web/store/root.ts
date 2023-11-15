import { enableStaticRendering } from "mobx-react-lite";
// store imports
import AppConfigStore, { IAppConfigStore } from "./app-config.store";
import CommandPaletteStore, { ICommandPaletteStore } from "./command-palette.store";
import UserStore, { IUserStore } from "store/user.store";
import ThemeStore, { IThemeStore } from "store/theme.store";
import {
  DraftIssuesStore,
  IIssueDetailStore,
  IIssueFilterStore,
  IIssueKanBanViewStore,
  IIssueStore,
  IssueDetailStore,
  IssueFilterStore,
  IssueKanBanViewStore,
  IIssueCalendarViewStore,
  IssueCalendarViewStore,
  IssueStore,
  IIssueQuickAddStore,
  IssueQuickAddStore,
} from "store/issue";
import {
  IWorkspaceFilterStore,
  IWorkspaceStore,
  WorkspaceFilterStore,
  WorkspaceStore,
  WorkspaceMemberStore,
  IWorkspaceMemberStore,
} from "store/workspace";
import {
  IProjectPublishStore,
  IProjectStore,
  ProjectPublishStore,
  ProjectStore,
  IProjectStateStore,
  ProjectStateStore,
  IProjectLabelStore,
  ProjectLabelStore,
  ProjectEstimatesStore,
  IProjectEstimateStore,
  ProjectMemberStore,
  IProjectMemberStore,
} from "store/project";
import {
  IModuleFilterStore,
  IModuleIssueKanBanViewStore,
  IModuleIssueStore,
  IModuleStore,
  ModuleFilterStore,
  ModuleIssueKanBanViewStore,
  ModuleIssueStore,
  IModuleIssueCalendarViewStore,
  ModuleIssueCalendarViewStore,
  ModuleStore,
} from "store/module";
import {
  CycleIssueFilterStore,
  CycleIssueKanBanViewStore,
  CycleIssueStore,
  CycleStore,
  ICycleIssueFilterStore,
  ICycleIssueKanBanViewStore,
  ICycleIssueCalendarViewStore,
  CycleIssueCalendarViewStore,
  ICycleIssueStore,
  ICycleStore,
} from "store/cycle";
import {
  IProjectViewFiltersStore,
  IProjectViewIssuesStore,
  IProjectViewsStore,
  ProjectViewFiltersStore,
  ProjectViewIssuesStore,
  ProjectViewsStore,
  IProjectViewIssueCalendarViewStore,
  ProjectViewIssueCalendarViewStore,
} from "store/project-view";
import CalendarStore, { ICalendarStore } from "store/calendar.store";
import {
  GlobalViewFiltersStore,
  GlobalViewIssuesStore,
  GlobalViewsStore,
  IGlobalViewFiltersStore,
  IGlobalViewIssuesStore,
  IGlobalViewsStore,
} from "store/global-view";
import {
  ProfileIssueStore,
  IProfileIssueStore,
  ProfileIssueFilterStore,
  IProfileIssueFilterStore,
} from "store/profile-issues";
import {
  ArchivedIssueStore,
  IArchivedIssueStore,
  ArchivedIssueFilterStore,
  IArchivedIssueFilterStore,
  ArchivedIssueDetailStore,
  IArchivedIssueDetailStore,
} from "store/archived-issues";
import { DraftIssueStore, IDraftIssueStore, DraftIssueFilterStore, IDraftIssueFilterStore } from "store/draft-issues";
import {
  IInboxFiltersStore,
  IInboxIssueDetailsStore,
  IInboxIssuesStore,
  IInboxStore,
  InboxFiltersStore,
  InboxIssueDetailsStore,
  InboxIssuesStore,
  InboxStore,
} from "store/inbox";
import { IWebhookStore, WebhookStore } from "./webhook.store";

import { IMentionsStore, MentionsStore } from "store/editor";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  user: IUserStore;
  theme: IThemeStore;
  appConfig: IAppConfigStore;
  commandPalette: ICommandPaletteStore;

  workspace: IWorkspaceStore;
  workspaceFilter: IWorkspaceFilterStore;
  workspaceMember: IWorkspaceMemberStore;

  projectPublish: IProjectPublishStore;
  project: IProjectStore;
  projectState: IProjectStateStore;
  projectLabel: IProjectLabelStore;
  projectEstimates: IProjectEstimateStore;
  projectMember: IProjectMemberStore;

  issue: IIssueStore;

  module: IModuleStore;
  moduleIssue: IModuleIssueStore;
  moduleFilter: IModuleFilterStore;
  moduleIssueKanBanView: IModuleIssueKanBanViewStore;
  moduleIssueCalendarView: IModuleIssueCalendarViewStore;

  cycle: ICycleStore;
  cycleIssue: ICycleIssueStore;
  cycleIssueFilter: ICycleIssueFilterStore;
  cycleIssueKanBanView: ICycleIssueKanBanViewStore;
  cycleIssueCalendarView: ICycleIssueCalendarViewStore;

  projectViews: IProjectViewsStore;
  projectViewIssues: IProjectViewIssuesStore;
  projectViewFilters: IProjectViewFiltersStore;
  projectViewIssueCalendarView: IProjectViewIssueCalendarViewStore;

  issueFilter: IIssueFilterStore;
  issueDetail: IIssueDetailStore;
  issueKanBanView: IIssueKanBanViewStore;
  issueCalendarView: IIssueCalendarViewStore;
  draftIssuesStore: DraftIssuesStore;
  quickAddIssue: IIssueQuickAddStore;

  calendar: ICalendarStore;

  globalViews: IGlobalViewsStore;
  globalViewIssues: IGlobalViewIssuesStore;
  globalViewFilters: IGlobalViewFiltersStore;

  profileIssues: IProfileIssueStore;
  profileIssueFilters: IProfileIssueFilterStore;

  archivedIssues: IArchivedIssueStore;
  archivedIssueDetail: IArchivedIssueDetailStore;
  archivedIssueFilters: IArchivedIssueFilterStore;

  draftIssues: IDraftIssueStore;
  draftIssueFilters: IDraftIssueFilterStore;

  inbox: IInboxStore;
  inboxIssues: IInboxIssuesStore;
  inboxIssueDetails: IInboxIssueDetailsStore;
  inboxFilters: IInboxFiltersStore;

  webhook: IWebhookStore;

  mentionsStore: IMentionsStore;

  constructor() {
    this.appConfig = new AppConfigStore(this);
    this.commandPalette = new CommandPaletteStore(this);
    this.user = new UserStore(this);
    this.theme = new ThemeStore(this);

    this.workspace = new WorkspaceStore(this);
    this.workspaceFilter = new WorkspaceFilterStore(this);
    this.workspaceMember = new WorkspaceMemberStore(this);

    this.project = new ProjectStore(this);
    this.projectState = new ProjectStateStore(this);
    this.projectLabel = new ProjectLabelStore(this);
    this.projectEstimates = new ProjectEstimatesStore(this);
    this.projectPublish = new ProjectPublishStore(this);
    this.projectMember = new ProjectMemberStore(this);

    this.module = new ModuleStore(this);
    this.moduleIssue = new ModuleIssueStore(this);
    this.moduleFilter = new ModuleFilterStore(this);
    this.moduleIssueKanBanView = new ModuleIssueKanBanViewStore(this);
    this.moduleIssueCalendarView = new ModuleIssueCalendarViewStore(this);

    this.cycle = new CycleStore(this);
    this.cycleIssue = new CycleIssueStore(this);
    this.cycleIssueFilter = new CycleIssueFilterStore(this);
    this.cycleIssueKanBanView = new CycleIssueKanBanViewStore(this);
    this.cycleIssueCalendarView = new CycleIssueCalendarViewStore(this);

    this.projectViews = new ProjectViewsStore(this);
    this.projectViewIssues = new ProjectViewIssuesStore(this);
    this.projectViewFilters = new ProjectViewFiltersStore(this);
    this.projectViewIssueCalendarView = new ProjectViewIssueCalendarViewStore(this);

    this.issue = new IssueStore(this);
    this.issueFilter = new IssueFilterStore(this);
    this.issueDetail = new IssueDetailStore(this);
    this.issueKanBanView = new IssueKanBanViewStore(this);
    this.issueCalendarView = new IssueCalendarViewStore(this);
    this.draftIssuesStore = new DraftIssuesStore(this);
    this.quickAddIssue = new IssueQuickAddStore(this);

    this.calendar = new CalendarStore(this);

    this.globalViews = new GlobalViewsStore(this);
    this.globalViewIssues = new GlobalViewIssuesStore(this);
    this.globalViewFilters = new GlobalViewFiltersStore(this);

    this.profileIssues = new ProfileIssueStore(this);
    this.profileIssueFilters = new ProfileIssueFilterStore(this);

    this.archivedIssues = new ArchivedIssueStore(this);
    this.archivedIssueDetail = new ArchivedIssueDetailStore(this);
    this.archivedIssueFilters = new ArchivedIssueFilterStore(this);

    this.draftIssues = new DraftIssueStore(this);
    this.draftIssueFilters = new DraftIssueFilterStore(this);

    this.inbox = new InboxStore(this);
    this.inboxIssues = new InboxIssuesStore(this);
    this.inboxIssueDetails = new InboxIssueDetailsStore(this);
    this.inboxFilters = new InboxFiltersStore(this);

    this.webhook = new WebhookStore(this);

    this.mentionsStore = new MentionsStore(this);
  }
}
