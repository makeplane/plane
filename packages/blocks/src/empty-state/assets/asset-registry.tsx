/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import type {
  CompactAssetType,
  DetailedAssetType,
  HorizontalStackAssetType,
  IllustrationAssetType,
  VerticalStackAssetType,
} from "./asset-types";

type IllustrationComponent = React.ComponentType<{ className?: string }>;
type LazyIllustration = React.LazyExoticComponent<IllustrationComponent>;

/**
 * Wraps a named-export illustration module in a `React.lazy` boundary.
 *
 * Each illustration is heavy (full inline SVG markup), and the registries below reference ~50 of
 * them. Importing the registry statically would pull every illustration into whichever chunk an
 * empty-state component lands in, even though a given empty state renders exactly one. Lazily
 * importing each illustration keeps them in their own on-demand chunks so only the rendered asset
 * is fetched. The `loader` specifier MUST stay a string literal so the bundler can code-split it.
 */
const lazyIllustration = (
  loader: () => Promise<Record<string, IllustrationComponent>>,
  exportName: string
): LazyIllustration =>
  React.lazy(async () => {
    const module = await loader();
    const Illustration = module?.[exportName];
    // A missing module or export means the illustration chunk resolved to nothing (stale deploy,
    // blocked request). These assets are purely decorative, so degrade to rendering nothing rather
    // than letting React.lazy reject and tear down the empty state — and the page — around it.
    if (!Illustration) {
      console.error(`[EmptyState] Illustration "${exportName}" failed to resolve from its chunk.`);
      return { default: (() => null) as IllustrationComponent };
    }
    return { default: Illustration };
  });

// Horizontal Stack Asset Registry
export const HORIZONTAL_STACK_ASSETS: Record<HorizontalStackAssetType, LazyIllustration> = {
  customer: lazyIllustration(() => import("./horizontal-stack/customer"), "CustomerHorizontalStackIllustration"),
  epic: lazyIllustration(() => import("./horizontal-stack/epic"), "EpicHorizontalStackIllustration"),
  estimate: lazyIllustration(() => import("./horizontal-stack/estimate"), "EstimateHorizontalStackIllustration"),
  export: lazyIllustration(() => import("./horizontal-stack/export"), "ExportHorizontalStackIllustration"),
  intake: lazyIllustration(() => import("./horizontal-stack/intake"), "IntakeHorizontalStackIllustration"),
  label: lazyIllustration(() => import("./horizontal-stack/label"), "LabelHorizontalStackIllustration"),
  link: lazyIllustration(() => import("./horizontal-stack/link"), "LinkHorizontalStackIllustration"),
  members: lazyIllustration(() => import("./horizontal-stack/members"), "MembersHorizontalStackIllustration"),
  note: lazyIllustration(() => import("./horizontal-stack/note"), "NoteHorizontalStackIllustration"),
  page: lazyIllustration(() => import("./horizontal-stack/page"), "PageHorizontalStackIllustration"),
  priority: lazyIllustration(() => import("./horizontal-stack/priority"), "PriorityHorizontalStackIllustration"),
  project: lazyIllustration(() => import("./horizontal-stack/project"), "ProjectHorizontalStackIllustration"),
  "search-compact": lazyIllustration(() => import("./horizontal-stack/search"), "SearchHorizontalStackIllustration"),
  settings: lazyIllustration(() => import("./horizontal-stack/settings"), "SettingsHorizontalStackIllustration"),
  script: lazyIllustration(() => import("./horizontal-stack/script"), "ScriptHorizontalStackIllustration"),
  state: lazyIllustration(() => import("./horizontal-stack/state"), "StateHorizontalStackIllustration"),
  "state-square": lazyIllustration(
    () => import("./horizontal-stack/state-square"),
    "StateSquareHorizontalStackIllustration"
  ),
  template: lazyIllustration(() => import("./horizontal-stack/template"), "TemplateHorizontalStackIllustration"),
  token: lazyIllustration(() => import("./horizontal-stack/token"), "TokenHorizontalStackIllustration"),
  unknown: lazyIllustration(() => import("./horizontal-stack/unknown"), "UnknownHorizontalStackIllustration"),
  update: lazyIllustration(() => import("./horizontal-stack/update"), "UpdateHorizontalStackIllustration"),
  webhook: lazyIllustration(() => import("./horizontal-stack/webhook"), "WebhookHorizontalStackIllustration"),
  "work-item": lazyIllustration(() => import("./horizontal-stack/work-item"), "WorkItemHorizontalStackIllustration"),
  worklog: lazyIllustration(() => import("./horizontal-stack/worklog"), "WorklogHorizontalStackIllustration"),
  workflow: lazyIllustration(() => import("./horizontal-stack/workflow"), "WorkflowHorizontalStackIllustration"),
  "group-syncing": lazyIllustration(
    () => import("./horizontal-stack/group-syncing"),
    "GroupSyncingHorizontalStackIllustration"
  ),
  "runner-scripts": lazyIllustration(
    () => import("./horizontal-stack/runner-scripts"),
    "RunnerScriptsHorizontalStackIllustration"
  ),
  "runner-functions": lazyIllustration(
    () => import("./horizontal-stack/runner-functions"),
    "RunnerFunctionsHorizontalStackIllustration"
  ),
  "custom-properties": lazyIllustration(
    () => import("./horizontal-stack/custom-properties"),
    "CustomPropertiesHorizontalStackIllustration"
  ),
  "ai-skills": lazyIllustration(() => import("./horizontal-stack/ai-skills"), "AiSkillsHorizontalStackIllustration"),
  "ai-agents": lazyIllustration(() => import("./horizontal-stack/ai-agents"), "AiAgentsHorizontalStackIllustration"),
  memory: lazyIllustration(() => import("./horizontal-stack/memory"), "MemoryHorizontalStackIllustration"),
};

// Vertical Stack Asset Registry
export const VERTICAL_STACK_ASSETS: Record<VerticalStackAssetType, LazyIllustration> = {
  "archived-cycle": lazyIllustration(
    () => import("./vertical-stack/archived-cycle"),
    "ArchivedCycleVerticalStackIllustration"
  ),
  "archived-module": lazyIllustration(
    () => import("./vertical-stack/archived-module"),
    "ArchivedModuleVerticalStackIllustration"
  ),
  "archived-work-item": lazyIllustration(
    () => import("./vertical-stack/archived-work-item"),
    "ArchivedWorkItemVerticalStackIllustration"
  ),
  changelog: lazyIllustration(() => import("./vertical-stack/changelog"), "ChangelogVerticalStackIllustration"),
  customer: lazyIllustration(() => import("./vertical-stack/customer"), "CustomerVerticalStackIllustration"),
  cycle: lazyIllustration(() => import("./vertical-stack/cycle"), "CycleVerticalStackIllustration"),
  dashboard: lazyIllustration(() => import("./vertical-stack/dashboard"), "DashboardVerticalStackIllustration"),
  draft: lazyIllustration(() => import("./vertical-stack/draft"), "DraftVerticalStackIllustration"),
  epic: lazyIllustration(() => import("./vertical-stack/epic"), "EpicVerticalStackIllustration"),
  "error-404": lazyIllustration(() => import("./vertical-stack/404-error"), "Error404VerticalStackIllustration"),
  inbox: lazyIllustration(() => import("./vertical-stack/inbox"), "InboxVerticalStackIllustration"),
  initiative: lazyIllustration(() => import("./vertical-stack/initiative"), "InitiativeVerticalStackIllustration"),
  "invalid-link": lazyIllustration(
    () => import("./vertical-stack/invalid-link"),
    "InvalidLinkVerticalStackIllustration"
  ),
  milestone: lazyIllustration(() => import("./vertical-stack/milestone"), "MilestoneVerticalStackIllustration"),
  module: lazyIllustration(() => import("./vertical-stack/module"), "ModuleVerticalStackIllustration"),
  "no-access": lazyIllustration(() => import("./vertical-stack/no-access"), "NoAccessVerticalStackIllustration"),
  page: lazyIllustration(() => import("./vertical-stack/page"), "PageVerticalStackIllustration"),
  property: lazyIllustration(() => import("./vertical-stack/property"), "PropertyVerticalStackIllustration"),
  project: lazyIllustration(() => import("./vertical-stack/project"), "ProjectVerticalStackIllustration"),
  "server-error": lazyIllustration(
    () => import("./vertical-stack/server-error"),
    "ServerErrorVerticalStackIllustration"
  ),
  stickies: lazyIllustration(() => import("./vertical-stack/stickies"), "StickiesVerticalStackIllustration"),
  teamspace: lazyIllustration(() => import("./vertical-stack/teamspace"), "TeamspaceVerticalStackIllustration"),
  view: lazyIllustration(() => import("./vertical-stack/view"), "ViewVerticalStackIllustration"),
  "work-item": lazyIllustration(() => import("./vertical-stack/work-item"), "WorkItemVerticalStackIllustration"),
  workflow: lazyIllustration(() => import("./vertical-stack/workflow"), "WorkflowVerticalStackIllustration"),
};

// Illustration Asset Registry
export const ILLUSTRATION_ASSETS: Record<IllustrationAssetType, LazyIllustration> = {
  inbox: lazyIllustration(() => import("./illustration/inbox"), "InboxIllustration"),
  search: lazyIllustration(() => import("./illustration/search"), "SearchIllustration"),
};

// Helper functions to get assets
export const getCompactAsset = (assetKey: CompactAssetType, className?: string): React.ReactNode => {
  const AssetComponent =
    HORIZONTAL_STACK_ASSETS[assetKey as HorizontalStackAssetType] ||
    ILLUSTRATION_ASSETS[assetKey as IllustrationAssetType];

  if (!AssetComponent) {
    console.warn(`Asset "${assetKey}" not found in compact asset registry`);
    return null;
  }

  return <AssetComponent className={className} />;
};

export const getDetailedAsset = (assetKey: DetailedAssetType, className?: string): React.ReactNode => {
  const AssetComponent =
    VERTICAL_STACK_ASSETS[assetKey as VerticalStackAssetType] || ILLUSTRATION_ASSETS[assetKey as IllustrationAssetType];

  if (!AssetComponent) {
    console.warn(`Asset "${assetKey}" not found in detailed asset registry`);
    return null;
  }

  return <AssetComponent className={className} />;
};
