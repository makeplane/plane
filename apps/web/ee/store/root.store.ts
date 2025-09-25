// plane web store
import { IIssuePropertiesActivityStore, IIssueTypesStore } from "@plane/types";
import {
  CustomerProperties,
  CustomerStore,
  ICustomerPropertiesStore,
  ICustomersStore,
} from "@/plane-web/store/customers";
import { ICycleStore, CycleStore } from "@/plane-web/store/cycle";
import { FeatureFlagsStore, IFeatureFlagsStore } from "@/plane-web/store/feature-flags/feature-flags.store";
import { IssuePropertiesActivityStore, IssueTypes } from "@/plane-web/store/issue-types";
import {
  IWorkspaceNotificationStore,
  WorkspaceNotificationStore,
} from "@/plane-web/store/notifications/notifications.store";
import { IPublishPageStore, PublishPageStore } from "@/plane-web/store/pages/publish-page.store";
import { IWorkspacePageStore, WorkspacePageStore } from "@/plane-web/store/pages/workspace-page.store";
import {
  ISelfHostedSubscriptionStore,
  SelfHostedSubscriptionStore,
} from "@/plane-web/store/subscription/self-hosted-subscription.store";
import {
  IWorkspaceSubscriptionStore,
  WorkspaceSubscriptionStore,
} from "@/plane-web/store/subscription/subscription.store";
import { ITeamspaceRootStore, TeamspaceRootStore } from "@/plane-web/store/teamspace";
import { TimeLineStore } from "@/plane-web/store/timeline";
import { IWorkspaceFeatureStore, WorkspaceFeatureStore } from "@/plane-web/store/workspace-feature.store";
import {
  IProjectFilterStore,
  ProjectFilterStore,
  IWorkspaceProjectStatesStore,
  WorkspaceProjectStatesStore,
} from "@/plane-web/store/workspace-project-states";
import {
  IWorkspaceWorklogStore,
  WorkspaceWorklogStore,
  IWorkspaceWorklogDownloadStore,
  WorkspaceWorklogDownloadStore,
} from "@/plane-web/store/workspace-worklog";
// store
import { CoreRootStore } from "@/store/root.store";
import { EZipDriverType } from "../types/importers/zip-importer";
// automations
import { AutomationsRootStore, IAutomationsRootStore } from "./automations/root.store";
// dashboards
import { BaseDashboardsStore, IBaseDashboardsStore } from "./dashboards/base-dashboards.store";
// importers
import { IGlobalViewStore, GlobalViewStore } from "./global-view.store";
import {
  IJiraStore,
  JiraStore,
  IJiraServerStore,
  JiraServerStore,
  ILinearStore,
  IFlatfileStore,
  LinearStore,
  IAsanaStore,
  AsanaStore,
  FlatfileStore,
  IZipImporterStore,
  ZipImporterStore,
} from "./importers";
// initiative
import { ClickUpStore, IClickUpStore } from "./importers/clickup/root.store";
import { IInitiativeFilterStore, InitiativeFilterStore } from "./initiatives/initiatives-filter.store";
import { IInitiativeStore, InitiativeStore } from "./initiatives/initiatives.store";
// integrations
import {
  ISlackStore,
  SlackStore,
  IGithubStore,
  GithubStore,
  IGitlabStore,
  GitlabStore,
  IConnectionStore,
  ConnectionStore,
  ISentryStore,
  SentryStore,
  GithubEnterpriseStore,
  IGithubEnterpriseStore,
  IGitlabEnterpriseStore,
  GitlabEnterpriseStore,
} from "./integrations";

import { EpicAnalytics, IEpicAnalyticStore } from "./issue/epic/analytic.store";
import { EpicBaseStore, IEpicBaseStore } from "./issue/epic/base.store";
// marketplace
import { IApplicationStore, ApplicationStore } from "./marketplace/application.store";
// pi chat
import { IPiChatStore, PiChatStore } from "./pi-chat/pi-chat";
// timeline
import { IProjectInboxStore, ProjectInboxStore } from "./project-inbox.store";
// project view
import { IProjectViewStore, ProjectViewStore } from "./project-view.store";
import { IProjectStore, ProjectStore } from "./projects/projects";
// templates
import { IRecurringWorkItemsRootStore, RecurringWorkItemsRootStore } from "./recurring-work-items/root.store";
import { ITemplatesRootStore, TemplatesRootStore } from "./templates/store/root.store";
// timeline
import { ITimelineStore } from "./timeline";

export class RootStore extends CoreRootStore {
  workspacePages: IWorkspacePageStore;
  publishPage: IPublishPageStore;
  workspaceSubscription: IWorkspaceSubscriptionStore;
  workspaceWorklogs: IWorkspaceWorklogStore;
  workspaceWorklogDownloads: IWorkspaceWorklogDownloadStore;
  featureFlags: IFeatureFlagsStore;
  selfHostedSubscription: ISelfHostedSubscriptionStore;
  workspaceFeatures: IWorkspaceFeatureStore;
  workspaceProjectStates: IWorkspaceProjectStatesStore;
  projectFilter: IProjectFilterStore;
  issueTypes: IIssueTypesStore;
  issuePropertiesActivity: IIssuePropertiesActivityStore;
  cycle: ICycleStore;
  piChat: IPiChatStore;
  timelineStore: ITimelineStore;
  projectDetails: IProjectStore;
  teamspaceRoot: ITeamspaceRootStore;
  workspaceNotification: IWorkspaceNotificationStore;
  projectInbox: IProjectInboxStore;
  customersStore: ICustomersStore;
  customerPropertiesStore: ICustomerPropertiesStore;
  projectView: IProjectViewStore;
  globalView: IGlobalViewStore;
  // importers
  jiraImporter: IJiraStore;
  jiraServerImporter: IJiraServerStore;
  linearImporter: ILinearStore;
  asanaImporter: IAsanaStore;
  flatfileImporter: IFlatfileStore;
  clickupImporter: IClickUpStore;
  notionImporter: IZipImporterStore;
  confluenceImporter: IZipImporterStore;
  // integrations
  connections: IConnectionStore;
  slackIntegration: ISlackStore;
  githubIntegration: IGithubStore;
  githubEnterpriseIntegration: IGithubEnterpriseStore;
  gitlabIntegration: IGitlabStore;
  gitlabEnterpriseIntegration: IGitlabEnterpriseStore;
  sentryIntegration: ISentryStore;
  initiativeFilterStore: IInitiativeFilterStore;
  initiativeStore: IInitiativeStore;
  // dashboards
  baseDashboards: IBaseDashboardsStore;
  // epics
  epicAnalytics: IEpicAnalyticStore;
  epicBaseStore: IEpicBaseStore;
  // marketplace
  applicationStore: IApplicationStore;
  // templates
  templatesRoot: ITemplatesRootStore;
  // recurring work items
  recurringWorkItemsRoot: IRecurringWorkItemsRootStore;
  // automations
  automationsRoot: IAutomationsRootStore;

  constructor() {
    super();
    this.workspacePages = new WorkspacePageStore(this);
    this.publishPage = new PublishPageStore(this);
    this.workspaceSubscription = new WorkspaceSubscriptionStore(this);
    this.workspaceWorklogs = new WorkspaceWorklogStore(this);
    this.workspaceWorklogDownloads = new WorkspaceWorklogDownloadStore(this);
    this.featureFlags = new FeatureFlagsStore(this);
    this.selfHostedSubscription = new SelfHostedSubscriptionStore(this);
    this.workspaceFeatures = new WorkspaceFeatureStore(this);
    this.workspaceProjectStates = new WorkspaceProjectStatesStore(this);
    this.issueTypes = new IssueTypes(this);
    this.issuePropertiesActivity = new IssuePropertiesActivityStore(this);
    this.projectFilter = new ProjectFilterStore(this);
    this.cycle = new CycleStore(this);
    this.piChat = new PiChatStore(this);
    this.timelineStore = new TimeLineStore(this);
    this.projectDetails = new ProjectStore(this);
    this.teamspaceRoot = new TeamspaceRootStore(this);
    this.workspaceNotification = new WorkspaceNotificationStore(this);
    this.projectInbox = new ProjectInboxStore(this);
    this.customersStore = new CustomerStore(this);
    this.customerPropertiesStore = new CustomerProperties(this);
    // project view
    this.projectView = new ProjectViewStore(this);
    this.globalView = new GlobalViewStore(this);
    // importers
    this.jiraImporter = new JiraStore(this);
    this.jiraServerImporter = new JiraServerStore(this);
    this.linearImporter = new LinearStore(this);
    this.asanaImporter = new AsanaStore(this);
    this.flatfileImporter = new FlatfileStore(this);
    this.clickupImporter = new ClickUpStore(this);
    this.notionImporter = new ZipImporterStore(this, EZipDriverType.NOTION);
    this.confluenceImporter = new ZipImporterStore(this, EZipDriverType.CONFLUENCE);
    // integrations
    this.connections = new ConnectionStore(this);
    this.slackIntegration = new SlackStore(this);
    this.githubIntegration = new GithubStore(this);
    this.githubEnterpriseIntegration = new GithubEnterpriseStore(this);
    this.gitlabIntegration = new GitlabStore(this);
    this.gitlabEnterpriseIntegration = new GitlabEnterpriseStore(this);
    this.sentryIntegration = new SentryStore(this);
    this.initiativeFilterStore = new InitiativeFilterStore(this);
    this.initiativeStore = new InitiativeStore(this, this.initiativeFilterStore);
    // dashboards
    this.baseDashboards = new BaseDashboardsStore(this);
    // epics
    this.epicAnalytics = new EpicAnalytics(this);
    this.epicBaseStore = new EpicBaseStore(this);
    // marketplace
    this.applicationStore = new ApplicationStore(this);
    // templates
    this.templatesRoot = new TemplatesRootStore(this);
    // recurring work items
    this.recurringWorkItemsRoot = new RecurringWorkItemsRootStore(this);
    // automations
    this.automationsRoot = new AutomationsRootStore(this);
  }

  resetOnSignOut() {
    super.resetOnSignOut();
    this.workspacePages = new WorkspacePageStore(this);
    this.publishPage = new PublishPageStore(this);
    this.workspaceSubscription = new WorkspaceSubscriptionStore(this);
    this.workspaceWorklogs = new WorkspaceWorklogStore(this);
    this.workspaceWorklogDownloads = new WorkspaceWorklogDownloadStore(this);
    this.featureFlags = new FeatureFlagsStore(this);
    this.selfHostedSubscription = new SelfHostedSubscriptionStore(this);
    this.workspaceFeatures = new WorkspaceFeatureStore(this);
    this.workspaceProjectStates = new WorkspaceProjectStatesStore(this);
    this.issueTypes = new IssueTypes(this);
    this.issuePropertiesActivity = new IssuePropertiesActivityStore(this);
    this.projectFilter = new ProjectFilterStore(this);
    this.cycle = new CycleStore(this);
    this.piChat = new PiChatStore(this);
    this.timelineStore = new TimeLineStore(this);
    this.projectDetails = new ProjectStore(this);
    this.teamspaceRoot = new TeamspaceRootStore(this);
    this.customersStore = new CustomerStore(this);
    this.customerPropertiesStore = new CustomerProperties(this);
    this.projectView = new ProjectViewStore(this);
    this.globalView = new GlobalViewStore(this);
    // importers
    this.jiraImporter = new JiraStore(this);
    this.jiraServerImporter = new JiraServerStore(this);
    this.linearImporter = new LinearStore(this);
    this.asanaImporter = new AsanaStore(this);
    this.flatfileImporter = new FlatfileStore(this);
    this.clickupImporter = new ClickUpStore(this);
    this.notionImporter = new ZipImporterStore(this, EZipDriverType.NOTION);
    this.confluenceImporter = new ZipImporterStore(this, EZipDriverType.CONFLUENCE);
    // integrations
    this.connections = new ConnectionStore(this);
    this.slackIntegration = new SlackStore(this);
    this.githubIntegration = new GithubStore(this);
    this.githubEnterpriseIntegration = new GithubEnterpriseStore(this);
    this.gitlabIntegration = new GitlabStore(this);
    this.gitlabEnterpriseIntegration = new GitlabEnterpriseStore(this);
    this.sentryIntegration = new SentryStore(this);
    this.initiativeFilterStore = new InitiativeFilterStore(this);
    this.initiativeStore = new InitiativeStore(this, this.initiativeFilterStore);
    // dashboards
    this.baseDashboards = new BaseDashboardsStore(this);
    // epics
    this.epicAnalytics = new EpicAnalytics(this);
    // marketplace
    this.applicationStore = new ApplicationStore(this);
    // templates
    this.templatesRoot = new TemplatesRootStore(this);
    // recurring work items
    this.recurringWorkItemsRoot = new RecurringWorkItemsRootStore(this);
    // automations
    this.automationsRoot = new AutomationsRootStore(this);
  }
}
