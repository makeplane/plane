/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TTranslationKeys, TTranslationStore } from "@plane/i18n";
import type { TFilterConfig, TWorkItemFilterProperty } from "@plane/types";

const WORK_ITEM_FILTER_LABELS = {
  state_id: "common.state",
  state_group: "common.state_group",
  assignee_id: "common.assignee",
  priority: "common.priority",
  project_id: "common.projects",
  mention_id: "mentions",
  label_id: "common.label",
  cycle_id: "common.cycle",
  module_id: "common.module",
  start_date: "start_date",
  target_date: "due_date",
  created_at: "common.sort.created_on",
  updated_at: "common.sort.updated_on",
  created_by_id: "common.created_by",
  subscriber_id: "common.filter_labels.subscriber",
} satisfies Record<TWorkItemFilterProperty, TTranslationKeys>;

/** Translate field labels once for the menu, search and applied conditions. */
export function localizeWorkItemFilterConfigs(
  configs: TFilterConfig<TWorkItemFilterProperty>[],
  t: TTranslationStore["t"]
): TFilterConfig<TWorkItemFilterProperty>[] {
  return configs.map((config) => ({
    ...config,
    label: t(WORK_ITEM_FILTER_LABELS[config.id]),
  }));
}
