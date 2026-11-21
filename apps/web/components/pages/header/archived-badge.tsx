/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { Badge } from "@makeplane/propel/components/badge";
import { Icon } from "@makeplane/propel/components/icon";
import { ArchiveOutline } from "@makeplane/propel/icons";
import { renderFormattedDate } from "@plane/utils";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

export const PageArchivedBadge = observer(function PageArchivedBadge({ page }: Props) {
  if (!page.archived_at) return null;

  return (
    <Badge
      variant="brand"
      size="sm"
      startIcon={<Icon icon={ArchiveOutline} />}
      label={`Archived at ${renderFormattedDate(page.archived_at) ?? ""}`}
    />
  );
});
