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

import { store } from "@/lib/store-context";
import { E_FEATURE_FLAGS } from "@plane/constants";
import type { TWorkspaceSettingsTabs } from "@plane/types";

export type TRenderSettingsLink = (workspaceSlug: string, settingKey: TWorkspaceSettingsTabs) => boolean;

export const shouldRenderSettingLink: TRenderSettingsLink = (workspaceSlug, settingKey) => {
  const isPiChatEnabled = store.aiFeatureFlags.getAiFeatureFlag(workspaceSlug, E_FEATURE_FLAGS.AI_CHAT, false);
  const isEditorOPSEnabled = store.featureFlags.getFeatureFlag(workspaceSlug, E_FEATURE_FLAGS.EDITOR_AI_OPS, false);
  const isPiDedupeEnabled = store.aiFeatureFlags.getAiFeatureFlag(workspaceSlug, E_FEATURE_FLAGS.AI_DEDUPE, false);
  const isPlaneRunnerEnabled = store.featureFlags.getFeatureFlag(workspaceSlug, E_FEATURE_FLAGS.PLANE_RUNNER, false);
  const isReleasesEnabled = store.featureFlags.getFeatureFlag(workspaceSlug, E_FEATURE_FLAGS.RELEASES, false);
  const isWorkItemTypesEnabled = store.featureFlags.getFeatureFlag(
    workspaceSlug,
    E_FEATURE_FLAGS.WORKSPACE_WORK_ITEM_TYPES,
    false
  );
  const isCustomRelationsEnabled = store.featureFlags.getFeatureFlag(
    workspaceSlug,
    E_FEATURE_FLAGS.CUSTOM_RELATIONS,
    false
  );
  const isWorkItemTypeHierarchyEnabled = store.featureFlags.getFeatureFlag(
    workspaceSlug,
    E_FEATURE_FLAGS.WORKITEM_TYPE_HIERARCHY,
    false
  );
  const isGroupSyncingEnabled = store.featureFlags.getFeatureFlag(workspaceSlug, E_FEATURE_FLAGS.IDP_GROUP_SYNC, false);
  // Cloud SSO is enabled if the instance is not self-managed (i.e cloud only)
  const isCloudSSOEnabled = store.instance.config?.is_self_managed === false ? true : false;
  switch (settingKey) {
    case "plane-intelligence":
      return isPiChatEnabled || isEditorOPSEnabled || isPiDedupeEnabled;
    case "identity":
      return isCloudSSOEnabled;
    case "scripts":
      return isPlaneRunnerEnabled && store.runners.isRunnerAvailable(workspaceSlug);
    case "releases":
      return isReleasesEnabled;
    case "relations":
      return isCustomRelationsEnabled;
    case "work_item_types":
      return isWorkItemTypesEnabled;
    case "work_item_type_hierarchy":
      return isWorkItemTypeHierarchyEnabled;
    case "group-syncing":
      return isGroupSyncingEnabled;
    default:
      return true;
  }
};
