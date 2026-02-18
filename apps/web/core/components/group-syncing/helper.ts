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

import type { GroupSyncConfig } from "@plane/types";

type TGroupSyncConfigKeys = keyof Pick<
  GroupSyncConfig,
  "sync_on_login" | "sync_offline" | "auto_remove" | "group_attribute_key"
>;

type TGroupSyncConfigObject = {
  key: TGroupSyncConfigKeys;
  i18n_title: string;
  i18n_description: string;
  i18n_placeholder?: string;
};

export const GROUP_SYNC_CONFIG: Record<TGroupSyncConfigKeys, TGroupSyncConfigObject> = {
  sync_on_login: {
    key: "sync_on_login",
    i18n_title: "workspace_settings.settings.group_syncing.config.sync_on_login.title",
    i18n_description: "workspace_settings.settings.group_syncing.config.sync_on_login.description",
  },
  sync_offline: {
    key: "sync_offline",
    i18n_title: "workspace_settings.settings.group_syncing.config.sync_offline.title",
    i18n_description: "workspace_settings.settings.group_syncing.config.sync_offline.description",
  },
  auto_remove: {
    key: "auto_remove",
    i18n_title: "workspace_settings.settings.group_syncing.config.auto_remove.title",
    i18n_description: "workspace_settings.settings.group_syncing.config.auto_remove.description",
  },
  group_attribute_key: {
    key: "group_attribute_key",
    i18n_title: "workspace_settings.settings.group_syncing.config.group_attribute_key.title",
    i18n_description: "workspace_settings.settings.group_syncing.config.group_attribute_key.description",
    i18n_placeholder: "workspace_settings.settings.group_syncing.config.group_attribute_key.placeholder",
  },
};
