/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { enableStaticRendering } from "mobx-react";
// plane imports
import { FALLBACK_LANGUAGE, LANGUAGE_STORAGE_KEY } from "@plane/i18n";
import type { IWorkItemFilterStore } from "@plane/shared-state";
import { RootWorkItemTypesStore, RootCustomPropertiesStore, WorkItemFilterStore } from "@plane/shared-state";
import type {
  CustomPropertyType,
  IIssueTypesStore,
  RootCustomPropertiesStoreSchema,
  RootWorkItemTypesStoreSchema,
} from "@plane/types";
// plane web store
import type { IAnalyticsStore } from "@/plane-web/store/analytics.store";
import { AnalyticsStore } from "@/plane-web/store/analytics.store";
import type { ICommandPaletteStore } from "@/plane-web/store/command-palette.store";
import { CommandPaletteStore } from "@/plane-web/store/command-palette.store";
import { PowerKStore } from "@/plane-web/store/power-k.store";
import type { IPowerKStore } from "@/plane-web/store/power-k.store";
import type { RootStore } from "@/plane-web/store/root.store";
import type { IStateStore } from "@/store/state.store";
import { StateStore } from "@/store/state.store";
// cycle
import { CycleStore } from "@/plane-web/store/cycle/cycle.store";
import type { ICycleStore } from "@/plane-web/store/cycle/cycle.store";
import type { ICycleFilterStore } from "./cycle_filter.store";
import { CycleFilterStore } from "./cycle_filter.store";
import type { IEditorAssetStore } from "./editor/asset.store";
import { EditorAssetStore } from "./editor/asset.store";
import type { IProjectEstimateStore } from "./estimates/project-estimate.store";
import { ProjectEstimateStore } from "./estimates/project-estimate.store";
import type { IFavoriteStore } from "./favorite.store";
import { FavoriteStore } from "./favorite.store";
// project inbox
import { ProjectInboxStore } from "@/plane-web/store/project-inbox.store";
import type { IProjectInboxStore } from "@/plane-web/store/project-inbox.store";
import type { IInstanceStore } from "./instance.store";
import { InstanceStore } from "./instance.store";
import type { IIssueRootStore } from "./work-items/root.store";
import { IssueRootStore } from "./work-items/root.store";
import type { ILabelStore } from "./label.store";
import { LabelStore } from "./label.store";
import type { IMemberRootStore } from "./member";
import { MemberRootStore } from "./member";
import type { IModuleStore } from "./module.store";
import { ModulesStore } from "./module.store";
import type { IModuleFilterStore } from "./module_filter.store";
import { ModuleFilterStore } from "./module_filter.store";
import type { IMultipleSelectStore } from "./multiple_select.store";
import { MultipleSelectStore } from "./multiple_select.store";
// notifications
import type { IWorkspaceNotificationStore } from "@/plane-web/store/notifications/notifications.store";
import { WorkspaceNotificationStore } from "@/plane-web/store/notifications/notifications.store";
import type { IProjectPageStore } from "./pages/project-page.store";
import { ProjectPageStore } from "./pages/project-page.store";
import type {
  IProjectFilterStore,
  IWorkspaceProjectStatesStore,
  IWorkspaceProjectLabelsStore,
} from "./workspace-project-states";
import {
  ProjectFilterStore,
  WorkspaceProjectStatesStore,
  WorkspaceProjectLabelsStore,
} from "./workspace-project-states";
import type { IProjectRootStore } from "./project";
import { ProjectRootStore } from "./project";
import type { IProjectDetailsStore } from "./project/project-details";
import { ProjectDetailsStore } from "./project/project-details";
// global view
import type { IGlobalViewStore } from "@/plane-web/store/global-view.store";
import { GlobalViewStore } from "@/plane-web/store/global-view.store";
// project view
import type { IProjectViewStore } from "@/plane-web/store/project-view.store";
import { ProjectViewStore } from "@/plane-web/store/project-view.store";
import type { IRouterStore } from "./router.store";
import { RouterStore } from "./router.store";
import type { IStickyStore } from "./sticky/sticky.store";
import { StickyStore } from "./sticky/sticky.store";
// theme
import { ThemeStore } from "@/plane-web/store/theme.store";
import type { IThemeStore } from "@/plane-web/store/theme.store";
import type { IUserStore } from "./user";
import { UserStore } from "./user";
import type { IWorkspaceRootStore } from "./workspace";
import { WorkspaceRootStore } from "./workspace";
import type { IGroupSyncStore } from "./group-sync.store";
import { GroupSyncStore } from "./group-sync.store";
import type { IFunctionsStore } from "./runners/functions.store";
import { FunctionsStore } from "./runners/functions.store";
import type { IRunnersStore } from "./runners/runners.store";
import { RunnersStore } from "./runners/runners.store";
// dashboards
import type { IBaseDashboardsStore } from "./dashboards/base-dashboards.store";
import { BaseDashboardsStore } from "./dashboards/base-dashboards.store";
// automations
import type { IAutomationsRootStore } from "./automations/root.store";
import { AutomationsRootStore } from "./automations/root.store";
// marketplace
import type { IApplicationStore } from "./marketplace/application.store";
import { ApplicationStore } from "./marketplace/application.store";
// Plane AI
import type { IPiChatStore } from "./pi-chat/pi-chat";
import { PiChatStore } from "./pi-chat/pi-chat";
// Plane AI feature flags
import type { IAiFeatureFlagsStore } from "./pi-chat/ai-feature-flags.store";
import { AiFeatureFlagsStore } from "./pi-chat/ai-feature-flags.store";
// teamspaces
import type { ITeamspaceRootStore } from "./teamspace";
import { TeamspaceRootStore } from "./teamspace";
// customers
import type { ICustomerPropertiesStore, ICustomersStore } from "./customers";
import { CustomerProperties, CustomerStore } from "./customers";
// importers
import type {
  IClickUpStore,
  ICSVImporterStore,
  IJiraStore,
  IJiraServerStore,
  ILinearStore,
  IFlatfileStore,
  IAsanaStore,
  IZipImporterStore,
} from "./importers";
import {
  ClickUpStore,
  CSVImporterStore,
  JiraStore,
  JiraServerStore,
  LinearStore,
  AsanaStore,
  FlatfileStore,
  ZipImporterStore,
} from "./importers";
import { EZipDriverType } from "@/types/importers/zip-importer";
// feature flag
import type { IFeatureFlagsStore } from "@/store/feature-flags/feature-flags.store";
import { FeatureFlagsStore } from "@/store/feature-flags/feature-flags.store";
// milestones
import { MilestoneStore } from "./milestones/milestone.store";
import type { IMilestoneStore } from "./milestones/milestone.store";
// templates
import type { ITemplatesRootStore } from "./templates/store/root.store";
import { TemplatesRootStore } from "./templates/store/root.store";
// worklog
import type { IWorklogStore, IWorklogDownloadStore } from "./worklog";
import { WorklogStore, WorklogDownloadStore } from "./worklog";
// initiatives
import type { IInitiativeFilterStore } from "./initiatives/initiatives-filter.store";
import { InitiativeFilterStore } from "./initiatives/initiatives-filter.store";
import type { IInitiativeStore } from "./initiatives/initiatives.store";
import { InitiativeStore } from "./initiatives/initiatives.store";
// recurring work items
import type { IRecurringWorkItemsRootStore } from "./recurring-work-items/root.store";
import { RecurringWorkItemsRootStore } from "./recurring-work-items/root.store";
// integrations
import type {
  ISlackStore,
  IGithubStore,
  IGitlabStore,
  IConnectionStore,
  ISentryStore,
  IGithubEnterpriseStore,
  IGitlabEnterpriseStore,
  IBitbucketStore,
} from "./integrations";
import {
  SlackStore,
  GithubStore,
  GitlabStore,
  ConnectionStore,
  SentryStore,
  GithubEnterpriseStore,
  GitlabEnterpriseStore,
  BitbucketStore,
} from "./integrations";
// workspace features
import type { IWorkspaceFeatureStore } from "@/store/workspace-feature.store";
import { WorkspaceFeatureStore } from "@/store/workspace-feature.store";
// member activity
import type { IWorkspaceMembersActivityStore } from "@/store/workspace-members-activity.store";
import { WorkspaceMembersActivityStore } from "@/store/workspace-members-activity.store";
import type { IProjectMembersActivityStore } from "@/store/project-members-activity.store";
import { ProjectMembersActivityStore } from "@/store/project-members-activity.store";
// agents
import type { IAgentStore } from "./agent";
import { AgentStore } from "./agent";
// intake type forms
import type { IIntakeTypeFormStore } from "./intake-type-form.store";
import { IntakeTypeFormStore } from "./intake-type-form.store";
// intake responsibility
import type { IIntakeResponsibilityStore } from "./intake-responsibility.store";
import { IntakeResponsibilityStore } from "./intake-responsibility.store";
// epics
import type { IEpicAnalyticStore } from "./work-items/epic/analytic.store";
import { EpicAnalytics } from "./work-items/epic/analytic.store";
import type { IEpicBaseStore } from "./work-items/epic/base.store";
import { EpicBaseStore } from "./work-items/epic/base.store";
// subscriptions
import type { ISelfHostedSubscriptionStore } from "./subscription/self-hosted-subscription.store";
import { SelfHostedSubscriptionStore } from "./subscription/self-hosted-subscription.store";
import type { IWorkspaceSubscriptionStore } from "./subscription/subscription.store";
import { WorkspaceSubscriptionStore } from "./subscription/subscription.store";
import type { IWorkflowsStore } from "./workflow/workflows.store";
import { WorkflowsStore } from "./workflow/workflows.store";
// work item types
import { WorkItemTypeBridgeStore } from "./work-item-type-bridge";
// relation definitions
import type { IRelationDefinitionStore } from "./relation-definition.store";
import { RelationDefinitionStore } from "./relation-definition.store";

enableStaticRendering(typeof window === "undefined");

export class CoreRootStore {
  workspaceRoot: IWorkspaceRootStore;
  workspaceProjectStates: IWorkspaceProjectStatesStore;
  workspaceProjectLabels: IWorkspaceProjectLabelsStore;
  projectFilter: IProjectFilterStore;
  projectRoot: IProjectRootStore;
  projectDetails: IProjectDetailsStore;
  memberRoot: IMemberRootStore;
  cycle: ICycleStore;
  cycleFilter: ICycleFilterStore;
  module: IModuleStore;
  moduleFilter: IModuleFilterStore;
  projectView: IProjectViewStore;
  globalView: IGlobalViewStore;
  issue: IIssueRootStore;
  state: IStateStore;
  label: ILabelStore;
  analytics: IAnalyticsStore;
  projectPages: IProjectPageStore;
  /** @deprecated Avoid router store to prevent sync issues. Use React Router params/props/hooks directly instead. */
  router: IRouterStore;
  commandPalette: ICommandPaletteStore;
  theme: IThemeStore;
  instance: IInstanceStore;
  user: IUserStore;
  projectInbox: IProjectInboxStore;
  projectEstimate: IProjectEstimateStore;
  multipleSelect: IMultipleSelectStore;
  workspaceNotification: IWorkspaceNotificationStore;
  favorite: IFavoriteStore;
  stickyStore: IStickyStore;
  editorAssetStore: IEditorAssetStore;
  workItemFilters: IWorkItemFilterStore;
  powerK: IPowerKStore;
  groupSync: IGroupSyncStore;
  runners: IRunnersStore;
  functions: IFunctionsStore;
  baseDashboards: IBaseDashboardsStore;
  automationsRoot: IAutomationsRootStore;
  applicationStore: IApplicationStore;
  piChat: IPiChatStore;
  aiFeatureFlags: IAiFeatureFlagsStore;
  teamspaceRoot: ITeamspaceRootStore;
  customersStore: ICustomersStore;
  customerPropertiesStore: ICustomerPropertiesStore;
  // importers
  jiraImporter: IJiraStore;
  csvImporter: ICSVImporterStore;
  jiraServerImporter: IJiraServerStore;
  linearImporter: ILinearStore;
  asanaImporter: IAsanaStore;
  flatfileImporter: IFlatfileStore;
  clickupImporter: IClickUpStore;
  notionImporter: IZipImporterStore;
  confluenceImporter: IZipImporterStore;
  featureFlags: IFeatureFlagsStore;
  milestone: IMilestoneStore;
  templatesRoot: ITemplatesRootStore;
  workspaceWorklogs: IWorklogStore;
  workspaceWorklogDownloads: IWorklogDownloadStore;
  initiativeFilterStore: IInitiativeFilterStore;
  initiativeStore: IInitiativeStore;
  recurringWorkItemsRoot: IRecurringWorkItemsRootStore;
  // integrations
  connections: IConnectionStore;
  slackIntegration: ISlackStore;
  githubIntegration: IGithubStore;
  githubEnterpriseIntegration: IGithubEnterpriseStore;
  gitlabIntegration: IGitlabStore;
  gitlabEnterpriseIntegration: IGitlabEnterpriseStore;
  sentryIntegration: ISentryStore;
  bitbucketDCIntegration: IBitbucketStore;
  workspaceFeatures: IWorkspaceFeatureStore;
  workspaceMembersActivityStore: IWorkspaceMembersActivityStore;
  projectMembersActivityStore: IProjectMembersActivityStore;
  agent: IAgentStore;
  intakeTypeForms: IIntakeTypeFormStore;
  intakeResponsibility: IIntakeResponsibilityStore;
  // epics
  epicAnalytics: IEpicAnalyticStore;
  epicBaseStore: IEpicBaseStore;
  // subscriptions
  workspaceSubscription: IWorkspaceSubscriptionStore;
  selfHostedSubscription: ISelfHostedSubscriptionStore;
  // workflows
  workflowsStore: IWorkflowsStore;
  // work item types
  workItemTypeBridge: IIssueTypesStore;
  workItemTypesRootStore: RootWorkItemTypesStoreSchema;
  customPropertiesRootStore: RootCustomPropertiesStoreSchema<CustomPropertyType>;
  // relation definitions
  relationDefinition: IRelationDefinitionStore;

  constructor() {
    this.router = new RouterStore();
    this.commandPalette = new CommandPaletteStore();
    this.instance = new InstanceStore();
    this.user = new UserStore(this as unknown as RootStore);
    this.theme = new ThemeStore();
    this.workspaceRoot = new WorkspaceRootStore(this as unknown as RootStore);
    this.workspaceProjectStates = new WorkspaceProjectStatesStore(this as unknown as RootStore);
    this.workspaceProjectLabels = new WorkspaceProjectLabelsStore(this as unknown as RootStore);
    this.projectFilter = new ProjectFilterStore(this as unknown as RootStore);
    this.projectRoot = new ProjectRootStore(this);
    this.projectDetails = new ProjectDetailsStore(this as unknown as RootStore);
    this.memberRoot = new MemberRootStore(this as unknown as RootStore);
    this.cycle = new CycleStore(this as unknown as RootStore);
    this.cycleFilter = new CycleFilterStore(this);
    this.module = new ModulesStore(this);
    this.moduleFilter = new ModuleFilterStore(this);
    this.projectView = new ProjectViewStore(this as unknown as RootStore);
    this.globalView = new GlobalViewStore(this as unknown as RootStore);
    this.issue = new IssueRootStore(this as unknown as RootStore);
    this.state = new StateStore(this as unknown as RootStore);
    this.label = new LabelStore(this);
    this.multipleSelect = new MultipleSelectStore();
    this.projectInbox = new ProjectInboxStore(this);
    this.projectPages = new ProjectPageStore(this as unknown as RootStore);
    this.projectEstimate = new ProjectEstimateStore(this);
    this.workspaceNotification = new WorkspaceNotificationStore(this as unknown as RootStore);
    this.favorite = new FavoriteStore(this);
    this.stickyStore = new StickyStore();
    this.editorAssetStore = new EditorAssetStore();
    this.analytics = new AnalyticsStore();
    this.workItemFilters = new WorkItemFilterStore();
    this.powerK = new PowerKStore();
    this.groupSync = new GroupSyncStore(this);
    // runners
    this.runners = new RunnersStore(this);
    this.functions = new FunctionsStore(this);
    this.baseDashboards = new BaseDashboardsStore(this as unknown as RootStore);
    this.automationsRoot = new AutomationsRootStore(this as unknown as RootStore);
    this.applicationStore = new ApplicationStore(this as unknown as RootStore);
    this.piChat = new PiChatStore(this as unknown as RootStore);
    this.aiFeatureFlags = new AiFeatureFlagsStore(this as unknown as RootStore);
    this.teamspaceRoot = new TeamspaceRootStore(this as unknown as RootStore);
    this.customersStore = new CustomerStore(this as unknown as RootStore);
    this.customerPropertiesStore = new CustomerProperties(this as unknown as RootStore);
    // importers
    this.jiraImporter = new JiraStore(this as unknown as RootStore);
    this.csvImporter = new CSVImporterStore(this as unknown as RootStore);
    this.jiraServerImporter = new JiraServerStore(this as unknown as RootStore);
    this.linearImporter = new LinearStore(this as unknown as RootStore);
    this.asanaImporter = new AsanaStore(this as unknown as RootStore);
    this.flatfileImporter = new FlatfileStore(this as unknown as RootStore);
    this.clickupImporter = new ClickUpStore(this as unknown as RootStore);
    this.notionImporter = new ZipImporterStore(this as unknown as RootStore, EZipDriverType.NOTION);
    this.confluenceImporter = new ZipImporterStore(this as unknown as RootStore, EZipDriverType.CONFLUENCE);
    this.featureFlags = new FeatureFlagsStore(this);
    this.milestone = new MilestoneStore(this as unknown as RootStore);
    this.templatesRoot = new TemplatesRootStore(this as unknown as RootStore);
    this.workspaceWorklogs = new WorklogStore(this as unknown as RootStore);
    this.workspaceWorklogDownloads = new WorklogDownloadStore(this as unknown as RootStore);
    this.initiativeFilterStore = new InitiativeFilterStore(this as unknown as RootStore);
    this.initiativeStore = new InitiativeStore(this as unknown as RootStore, this.initiativeFilterStore);
    this.recurringWorkItemsRoot = new RecurringWorkItemsRootStore(this as unknown as RootStore);
    // integrations
    this.connections = new ConnectionStore(this as unknown as RootStore);
    this.slackIntegration = new SlackStore(this as unknown as RootStore);
    this.githubIntegration = new GithubStore(this as unknown as RootStore);
    this.githubEnterpriseIntegration = new GithubEnterpriseStore(this as unknown as RootStore);
    this.gitlabIntegration = new GitlabStore(this as unknown as RootStore);
    this.gitlabEnterpriseIntegration = new GitlabEnterpriseStore(this as unknown as RootStore);
    this.sentryIntegration = new SentryStore(this as unknown as RootStore);
    this.bitbucketDCIntegration = new BitbucketStore(this as unknown as RootStore);
    this.workspaceFeatures = new WorkspaceFeatureStore(this as unknown as RootStore);
    this.workspaceMembersActivityStore = new WorkspaceMembersActivityStore(this as unknown as RootStore);
    this.projectMembersActivityStore = new ProjectMembersActivityStore(this as unknown as RootStore);
    this.agent = new AgentStore(this as unknown as RootStore);
    this.intakeTypeForms = new IntakeTypeFormStore(this as unknown as RootStore);
    this.intakeResponsibility = new IntakeResponsibilityStore(this as unknown as RootStore);
    // epics
    this.epicAnalytics = new EpicAnalytics(this as unknown as RootStore);
    this.epicBaseStore = new EpicBaseStore(this as unknown as RootStore);
    // subscriptions
    this.workspaceSubscription = new WorkspaceSubscriptionStore(this as unknown as RootStore);
    this.selfHostedSubscription = new SelfHostedSubscriptionStore(this as unknown as RootStore);
    // workflows
    this.workflowsStore = new WorkflowsStore(this as unknown as RootStore);
    // work item types
    this.workItemTypesRootStore = new RootWorkItemTypesStore({
      getWorkspaceSlugById: this.workspaceRoot.getWorkspaceSlugById.bind(this.workspaceRoot),
      getProjectRoleByWorkspaceSlugAndProjectId: this.user.permission.getProjectRoleByWorkspaceSlugAndProjectId.bind(
        this.user.permission
      ),
      getWorkspaceRoleByWorkspaceSlug: this.user.permission.getWorkspaceRoleByWorkspaceSlug.bind(this.user.permission),
    });
    this.customPropertiesRootStore = new RootCustomPropertiesStore<CustomPropertyType>({
      getWorkspaceSlugById: this.workspaceRoot.getWorkspaceSlugById.bind(this.workspaceRoot),
      getWorkspaceRoleByWorkspaceSlug: this.user.permission.getWorkspaceRoleByWorkspaceSlug.bind(this.user.permission),
    });
    this.workItemTypeBridge = new WorkItemTypeBridgeStore(this as unknown as RootStore);
    // relation definitions
    this.relationDefinition = new RelationDefinitionStore();
  }

  resetOnSignOut() {
    // handling the system theme when user logged out from the app
    localStorage.setItem("theme", "system");
    localStorage.setItem(LANGUAGE_STORAGE_KEY, FALLBACK_LANGUAGE);
    this.router = new RouterStore();
    this.commandPalette = new CommandPaletteStore();
    this.instance = new InstanceStore();
    this.user = new UserStore(this as unknown as RootStore);
    this.workspaceRoot = new WorkspaceRootStore(this as unknown as RootStore);
    this.workspaceProjectStates = new WorkspaceProjectStatesStore(this as unknown as RootStore);
    this.workspaceProjectLabels = new WorkspaceProjectLabelsStore(this as unknown as RootStore);
    this.projectFilter = new ProjectFilterStore(this as unknown as RootStore);
    this.projectRoot = new ProjectRootStore(this);
    this.projectDetails = new ProjectDetailsStore(this as unknown as RootStore);
    this.memberRoot = new MemberRootStore(this as unknown as RootStore);
    this.cycle = new CycleStore(this as unknown as RootStore);
    this.cycleFilter = new CycleFilterStore(this);
    this.module = new ModulesStore(this);
    this.moduleFilter = new ModuleFilterStore(this);
    this.projectView = new ProjectViewStore(this as unknown as RootStore);
    this.globalView = new GlobalViewStore(this as unknown as RootStore);
    this.issue = new IssueRootStore(this as unknown as RootStore);
    this.state = new StateStore(this as unknown as RootStore);
    this.label = new LabelStore(this);
    this.projectInbox = new ProjectInboxStore(this);
    this.projectPages = new ProjectPageStore(this as unknown as RootStore);
    this.multipleSelect = new MultipleSelectStore();
    this.projectEstimate = new ProjectEstimateStore(this);
    this.workspaceNotification = new WorkspaceNotificationStore(this as unknown as RootStore);
    this.favorite = new FavoriteStore(this);
    this.stickyStore = new StickyStore();
    this.editorAssetStore = new EditorAssetStore();
    this.workItemFilters = new WorkItemFilterStore();
    this.powerK = new PowerKStore();
    this.groupSync = new GroupSyncStore(this);
    // runners
    this.runners = new RunnersStore(this);
    this.functions = new FunctionsStore(this);
    this.baseDashboards = new BaseDashboardsStore(this as unknown as RootStore);
    this.automationsRoot = new AutomationsRootStore(this as unknown as RootStore);
    this.applicationStore = new ApplicationStore(this as unknown as RootStore);
    this.piChat = new PiChatStore(this as unknown as RootStore);
    this.aiFeatureFlags = new AiFeatureFlagsStore(this as unknown as RootStore);
    this.teamspaceRoot = new TeamspaceRootStore(this as unknown as RootStore);
    this.customersStore = new CustomerStore(this as unknown as RootStore);
    this.customerPropertiesStore = new CustomerProperties(this as unknown as RootStore);
    // importers
    this.jiraImporter = new JiraStore(this as unknown as RootStore);
    this.csvImporter = new CSVImporterStore(this as unknown as RootStore);
    this.jiraServerImporter = new JiraServerStore(this as unknown as RootStore);
    this.linearImporter = new LinearStore(this as unknown as RootStore);
    this.asanaImporter = new AsanaStore(this as unknown as RootStore);
    this.flatfileImporter = new FlatfileStore(this as unknown as RootStore);
    this.clickupImporter = new ClickUpStore(this as unknown as RootStore);
    this.notionImporter = new ZipImporterStore(this as unknown as RootStore, EZipDriverType.NOTION);
    this.confluenceImporter = new ZipImporterStore(this as unknown as RootStore, EZipDriverType.CONFLUENCE);
    this.confluenceImporter = new ZipImporterStore(this as unknown as RootStore, EZipDriverType.CONFLUENCE);
    this.featureFlags = new FeatureFlagsStore(this);
    this.milestone = new MilestoneStore(this as unknown as RootStore);
    this.templatesRoot = new TemplatesRootStore(this as unknown as RootStore);
    this.workspaceWorklogs = new WorklogStore(this as unknown as RootStore);
    this.workspaceWorklogDownloads = new WorklogDownloadStore(this as unknown as RootStore);
    this.initiativeFilterStore = new InitiativeFilterStore(this as unknown as RootStore);
    this.initiativeStore = new InitiativeStore(this as unknown as RootStore, this.initiativeFilterStore);
    this.recurringWorkItemsRoot = new RecurringWorkItemsRootStore(this as unknown as RootStore);
    // integrations
    this.connections = new ConnectionStore(this as unknown as RootStore);
    this.slackIntegration = new SlackStore(this as unknown as RootStore);
    this.githubIntegration = new GithubStore(this as unknown as RootStore);
    this.githubEnterpriseIntegration = new GithubEnterpriseStore(this as unknown as RootStore);
    this.gitlabIntegration = new GitlabStore(this as unknown as RootStore);
    this.gitlabEnterpriseIntegration = new GitlabEnterpriseStore(this as unknown as RootStore);
    this.sentryIntegration = new SentryStore(this as unknown as RootStore);
    this.bitbucketDCIntegration = new BitbucketStore(this as unknown as RootStore);
    this.workspaceFeatures = new WorkspaceFeatureStore(this as unknown as RootStore);
    this.workspaceMembersActivityStore = new WorkspaceMembersActivityStore(this as unknown as RootStore);
    this.projectMembersActivityStore = new ProjectMembersActivityStore(this as unknown as RootStore);
    this.agent = new AgentStore(this as unknown as RootStore);
    this.intakeTypeForms = new IntakeTypeFormStore(this as unknown as RootStore);
    this.intakeResponsibility = new IntakeResponsibilityStore(this as unknown as RootStore);
    // epics
    this.epicAnalytics = new EpicAnalytics(this as unknown as RootStore);
    this.epicBaseStore = new EpicBaseStore(this as unknown as RootStore);
    // subscriptions
    this.workspaceSubscription = new WorkspaceSubscriptionStore(this as unknown as RootStore);
    this.selfHostedSubscription = new SelfHostedSubscriptionStore(this as unknown as RootStore);
    // workflows
    this.workflowsStore = new WorkflowsStore(this as unknown as RootStore);
    // work item types
    this.workItemTypesRootStore = new RootWorkItemTypesStore({
      getWorkspaceSlugById: this.workspaceRoot.getWorkspaceSlugById.bind(this.workspaceRoot),
      getProjectRoleByWorkspaceSlugAndProjectId: this.user.permission.getProjectRoleByWorkspaceSlugAndProjectId.bind(
        this.user.permission
      ),
      getWorkspaceRoleByWorkspaceSlug: this.user.permission.getWorkspaceRoleByWorkspaceSlug.bind(this.user.permission),
    });
    this.customPropertiesRootStore = new RootCustomPropertiesStore<CustomPropertyType>({
      getWorkspaceSlugById: this.workspaceRoot.getWorkspaceSlugById.bind(this.workspaceRoot),
      getWorkspaceRoleByWorkspaceSlug: this.user.permission.getWorkspaceRoleByWorkspaceSlug.bind(this.user.permission),
    });
    this.workItemTypeBridge = new WorkItemTypeBridgeStore(this as unknown as RootStore);
    // relation definitions
    this.relationDefinition = new RelationDefinitionStore();
  }
}
