import React from "react";
import type {
  CompactAssetType,
  DetailedAssetType,
  HorizontalStackAssetType,
  IllustrationAssetType,
  VerticalStackAssetType,
} from "./asset-types";
import {
  CustomerHorizontalStackIllustration,
  EpicHorizontalStackIllustration,
  EstimateHorizontalStackIllustration,
  ExportHorizontalStackIllustration,
  IntakeHorizontalStackIllustration,
  LabelHorizontalStackIllustration,
  LinkHorizontalStackIllustration,
  MembersHorizontalStackIllustration,
  NoteHorizontalStackIllustration,
  PriorityHorizontalStackIllustration,
  ProjectHorizontalStackIllustration,
  SettingsHorizontalStackIllustration,
  StateHorizontalStackIllustration,
  TemplateHorizontalStackIllustration,
  TokenHorizontalStackIllustration,
  UnknownHorizontalStackIllustration,
  UpdateHorizontalStackIllustration,
  WebhookHorizontalStackIllustration,
  WorkItemHorizontalStackIllustration,
  WorklogHorizontalStackIllustration,
} from "./horizontal-stack";
import { InboxIllustration, SearchIllustration } from "./illustration";
import {
  ArchivedCycleVerticalStackIllustration,
  ArchivedModuleVerticalStackIllustration,
  ArchivedWorkItemVerticalStackIllustration,
  ChangelogVerticalStackIllustration,
  CustomerVerticalStackIllustration,
  CycleVerticalStackIllustration,
  DashboardVerticalStackIllustration,
  DraftVerticalStackIllustration,
  EpicVerticalStackIllustration,
  Error404VerticalStackIllustration,
  InitiativeVerticalStackIllustration,
  InvalidLinkVerticalStackIllustration,
  ModuleVerticalStackIllustration,
  NoAccessVerticalStackIllustration,
  PageVerticalStackIllustration,
  ProjectVerticalStackIllustration,
  ServerErrorVerticalStackIllustration,
  TeamspaceVerticalStackIllustration,
  ViewVerticalStackIllustration,
  WorkItemVerticalStackIllustration,
} from "./vertical-stack";

// Horizontal Stack Asset Registry
export const HORIZONTAL_STACK_ASSETS: Record<HorizontalStackAssetType, React.ComponentType<{ className?: string }>> = {
  customer: CustomerHorizontalStackIllustration,
  epic: EpicHorizontalStackIllustration,
  estimate: EstimateHorizontalStackIllustration,
  export: ExportHorizontalStackIllustration,
  intake: IntakeHorizontalStackIllustration,
  label: LabelHorizontalStackIllustration,
  link: LinkHorizontalStackIllustration,
  members: MembersHorizontalStackIllustration,
  note: NoteHorizontalStackIllustration,
  priority: PriorityHorizontalStackIllustration,
  project: ProjectHorizontalStackIllustration,
  settings: SettingsHorizontalStackIllustration,
  state: StateHorizontalStackIllustration,
  template: TemplateHorizontalStackIllustration,
  token: TokenHorizontalStackIllustration,
  unknown: UnknownHorizontalStackIllustration,
  update: UpdateHorizontalStackIllustration,
  webhook: WebhookHorizontalStackIllustration,
  "work-item": WorkItemHorizontalStackIllustration,
  worklog: WorklogHorizontalStackIllustration,
};

// Vertical Stack Asset Registry
export const VERTICAL_STACK_ASSETS: Record<VerticalStackAssetType, React.ComponentType<{ className?: string }>> = {
  "archived-cycle": ArchivedCycleVerticalStackIllustration,
  "archived-module": ArchivedModuleVerticalStackIllustration,
  "archived-work-item": ArchivedWorkItemVerticalStackIllustration,
  changelog: ChangelogVerticalStackIllustration,
  customer: CustomerVerticalStackIllustration,
  cycle: CycleVerticalStackIllustration,
  dashboard: DashboardVerticalStackIllustration,
  draft: DraftVerticalStackIllustration,
  epic: EpicVerticalStackIllustration,
  "error-404": Error404VerticalStackIllustration,
  initiative: InitiativeVerticalStackIllustration,
  "invalid-link": InvalidLinkVerticalStackIllustration,
  module: ModuleVerticalStackIllustration,
  "no-access": NoAccessVerticalStackIllustration,
  page: PageVerticalStackIllustration,
  project: ProjectVerticalStackIllustration,
  "server-error": ServerErrorVerticalStackIllustration,
  teamspace: TeamspaceVerticalStackIllustration,
  view: ViewVerticalStackIllustration,
  "work-item": WorkItemVerticalStackIllustration,
};

// Illustration Asset Registry
export const ILLUSTRATION_ASSETS: Record<IllustrationAssetType, React.ComponentType<{ className?: string }>> = {
  inbox: InboxIllustration,
  search: SearchIllustration,
};

// Helper functions to get assets
export const getCompactAsset = (assetKey: CompactAssetType, className?: string): React.ReactNode => {
  const AssetComponent =
    (HORIZONTAL_STACK_ASSETS[assetKey as HorizontalStackAssetType] as React.ComponentType<{ className?: string }>) ||
    ILLUSTRATION_ASSETS[assetKey as IllustrationAssetType];

  if (!AssetComponent) {
    console.warn(`Asset "${assetKey}" not found in compact asset registry`);
    return null;
  }

  return <AssetComponent className={className} />;
};

export const getDetailedAsset = (assetKey: DetailedAssetType, className?: string): React.ReactNode => {
  const AssetComponent =
    (VERTICAL_STACK_ASSETS[assetKey as VerticalStackAssetType] as React.ComponentType<{ className?: string }>) ||
    ILLUSTRATION_ASSETS[assetKey as IllustrationAssetType];

  if (!AssetComponent) {
    console.warn(`Asset "${assetKey}" not found in detailed asset registry`);
    return null;
  }

  return <AssetComponent className={className} />;
};
