/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ArchiveIcon, Earth } from "lucide-react";
import { EPageAccess } from "@plane/constants";
import { LockIcon } from "@plane/propel/icons";
import type { TPage } from "@plane/types";

export function PageAccessIcon(page: TPage) {
  return (
    <div>
      {page.archived_at ? (
        <ArchiveIcon className="h-2.5 w-2.5 text-tertiary" />
      ) : page.access === EPageAccess.PUBLIC ? (
        <Earth className="h-2.5 w-2.5 text-tertiary" />
      ) : (
        <LockIcon className="h-2.5 w-2.5 text-tertiary" />
      )}
    </div>
  );
}
