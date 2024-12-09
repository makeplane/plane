// plane web store
import { ICycleStore, CycleStore } from "@/plane-web/store/cycle.store";
import { FeatureFlagsStore, IFeatureFlagsStore } from "@/plane-web/store/feature-flags/feature-flags.store";
import {
  IIssuePropertiesActivityStore,
  IIssueTypesStore,
  IssuePropertiesActivityStore,
  IssueTypes,
} from "@/plane-web/store/issue-types";
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
// importers
import {
  IJiraStore,
  JiraStore,
  IJiraServerStore,
  JiraServerStore,
  ILinearStore,
  LinearStore,
  IAsanaStore,
  AsanaStore,
} from "./importers";
// integrations
import { ISlackStore, SlackStore } from "./integrations";
// pi chat
import { IPiChatStore, PiChatStore } from "./pi-chat/pi-chat";
// timeline
import { ITimelineStore, TimeLineStore } from "./timeline";

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
  // importers
  jiraImporter: IJiraStore;
  jiraServerImporter: IJiraServerStore;
  linearImporter: ILinearStore;
  asanaImporter: IAsanaStore;
  // integrations
  slackIntegration: ISlackStore;

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
    // importers
    this.jiraImporter = new JiraStore(this);
    this.jiraServerImporter = new JiraServerStore(this);
    this.linearImporter = new LinearStore(this);
    this.asanaImporter = new AsanaStore(this);
    // integrations
    this.slackIntegration = new SlackStore(this);
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
    // importers
    this.jiraImporter = new JiraStore(this);
    this.jiraServerImporter = new JiraServerStore(this);
    this.linearImporter = new LinearStore(this);
    this.asanaImporter = new AsanaStore(this);
    // integrations
    this.slackIntegration = new SlackStore(this);
  }
}
