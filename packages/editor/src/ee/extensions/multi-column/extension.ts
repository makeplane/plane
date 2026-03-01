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

import type { Extension } from "@tiptap/core";
// local imports
import { MultiColumnExtensionConfig } from "./extension-config";
import type { MultiColumnExtensionOptions } from "./types";

type Props = MultiColumnExtensionOptions;

export const MultiColumnExtension = (props: Props): Extension => {
  const { isFlagged } = props;

  return MultiColumnExtensionConfig.extend<MultiColumnExtensionOptions>({
    addOptions() {
      return {
        ...this.parent?.(),
        isFlagged,
      };
    },
  });
};
