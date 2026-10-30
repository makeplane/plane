/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { PrioritySelect } from "@plane/blocks/property-select";
import type { SelectVariant } from "@plane/blocks/select";
import { useTranslation } from "@plane/i18n";
import type { TIssuePriorities } from "@plane/types";
import { cn } from "@plane/utils";
// helpers
import { READ_ONLY_SELECT_CLASSNAME } from "@/helpers/select.helper";

type Props = {
  priority: TIssuePriorities | null;
  variant?: SelectVariant;
  className?: string;
};

/** The work item priority as a read-only `PrioritySelect` chip. */
export function IssueBlockPriority(props: Props) {
  const { priority, variant = "pill-md", className } = props;
  // i18n
  const { t } = useTranslation();

  return (
    <PrioritySelect
      value={priority ?? "none"}
      onChange={() => {}}
      variant={variant}
      placeholder={t("common.priority")}
      className={cn(READ_ONLY_SELECT_CLASSNAME, className)}
      tooltip={{ heading: t("common.priority"), emptyContent: t("common.none") }}
      disabled
    />
  );
}
