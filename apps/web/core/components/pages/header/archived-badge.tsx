/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { ArchiveIcon } from "@plane/propel/icons";
import { renderFormattedDate } from "@plane/utils";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

export const PageArchivedBadge = observer(function PageArchivedBadge({ page }: Props) {
  if (!page.archived_at) return null;

  return (
    <div className="flex h-6 flex-shrink-0 items-center gap-1 rounded-sm bg-accent-primary/20 px-2 text-accent-primary">
      <ArchiveIcon className="size-3.5 flex-shrink-0" />
      <span className="text-11 font-medium">Archived at {renderFormattedDate(page.archived_at)}</span>
    </div>
  );
});
