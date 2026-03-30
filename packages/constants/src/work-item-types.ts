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

export const DEFAULT_BACKGROUND_COLORS = [
  "#EF5974",
  "#FF7474",
  "#FC964D",
  "#1FA191",
  "#6DBCF5",
  "#748AFF",
  "#4C49F8",
  "#5D407A",
  "#999AA0",
];

export const WORK_ITEM_TYPE_ERROR_DETAILS: Record<string, { i18n_message: string }> = {
  CANNOT_DELETE_DEFAULT_WORK_ITEM_TYPE: {
    i18n_message: "work_item_types.settings.item_delete_confirmation.errors.cannot_delete_default_work_item_type",
  },
  CANNOT_DELETE_WORK_ITEM_TYPE_WITH_ASSOCIATED_WORK_ITEMS: {
    i18n_message:
      "work_item_types.settings.item_delete_confirmation.errors.cannot_delete_work_item_type_with_associated_work_items",
  },
};
