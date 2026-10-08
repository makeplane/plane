/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ArchiveOutline, GlobeOutline, LockOutline } from "@makeplane/propel/icons";
import { EPageAccess } from "@plane/constants";
import type { TPage } from "@plane/types";

export function PageAccessIcon(page: TPage) {
  return (
    <div>
      {page.archived_at ? (
        <ArchiveOutline className="h-2.5 w-2.5 text-tertiary" />
      ) : page.access === EPageAccess.PUBLIC ? (
        <GlobeOutline className="h-2.5 w-2.5 text-tertiary" />
      ) : (
        <LockOutline className="h-2.5 w-2.5 text-tertiary" />
      )}
    </div>
  );
}
