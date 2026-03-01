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

import { Extension } from "@tiptap/core";
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";
// extensions
import { Column } from "./column/extension";
import { ColumnList } from "./column-list/extension";
import { MultiColumnPlaceholderExtension } from "./column/plugins/placeholder";
// types
import type { MultiColumnExtensionType, MultiColumnExtensionOptions } from "./types";

export const MultiColumnExtensionConfig: MultiColumnExtensionType = Extension.create<MultiColumnExtensionOptions>({
  name: ADDITIONAL_EXTENSIONS.MULTI_COLUMN,

  addOptions() {
    return {
      isFlagged: false,
    };
  },

  addExtensions() {
    return [ColumnList, Column, MultiColumnPlaceholderExtension];
  },
});
