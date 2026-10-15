/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
// types
import { PriorityIcon } from "@plane/blocks/icons";
import type { TIssuePriorities } from "@plane/types";
// constants
import { getIssuePriorityFilters } from "@plane/utils";
import { ReadOnlyProperty } from "./read-only-property";

export function IssueBlockPriority({
  priority,
  shouldShowName = false,
}: {
  priority: TIssuePriorities | null;
  shouldShowName?: boolean;
}) {
  // hooks
  const { t } = useTranslation();
  const priority_detail = priority != null ? getIssuePriorityFilters(priority) : null;

  if (!priority_detail) return null;
  const priorityLabel = t(priority_detail.titleTranslationKey);

  return (
    <ReadOnlyProperty
      icon={<PriorityIcon priority={priority} />}
      label={shouldShowName ? priorityLabel : undefined}
      tooltip={`Priority: ${priorityLabel}`}
    />
  );
}
