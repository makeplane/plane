/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { LabelPill, LabelSelect } from "@plane/blocks/property-select";
import type { SelectVariant } from "@plane/blocks/select";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// helpers
import { READ_ONLY_SELECT_CLASSNAME, toSinglePage } from "@/helpers/select.helper";
// hooks
import { useLabel } from "@/hooks/store/use-label";

/** Up to this many labels are shown as individual pills; more collapse into one "N labels" chip. */
const MAX_INDIVIDUAL_LABEL_PILLS = 2;

type Props = {
  labelIds: string[];
  variant?: SelectVariant;
  placeholder?: string;
  className?: string;
};

/** The work item labels as read-only pills, or a read-only `LabelSelect` summary chip. */
export const IssueBlockLabels = observer(function IssueBlockLabels(props: Props) {
  const { labelIds, variant = "pill-md", placeholder, className } = props;
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { labels, getLabelsByIds } = useLabel();
  // derived values
  const selectedLabels = getLabelsByIds(labelIds ?? []).map((label) => ({
    id: label.id,
    name: label.name,
    color: label.color ?? "",
  }));
  const isPillVariant = variant.startsWith("pill-");

  if (isPillVariant && selectedLabels.length > 1 && selectedLabels.length <= MAX_INDIVIDUAL_LABEL_PILLS) {
    return (
      <Tooltip label={`${t("common.labels")}: ${selectedLabels.map((label) => label.name).join(", ")}`}>
        <div className="flex max-w-full min-w-0 items-center gap-1 overflow-hidden">
          {selectedLabels.map((label) => (
            <LabelPill key={label.id} label={label} variant="outline" />
          ))}
        </div>
      </Tooltip>
    );
  }

  return (
    <LabelSelect
      getValues={() =>
        toSinglePage(labels?.map((label) => ({ id: label.id, name: label.name, color: label.color ?? "" })))
      }
      value={selectedLabels}
      onChange={() => {}}
      variant={variant}
      placeholder={placeholder}
      className={cn(READ_ONLY_SELECT_CLASSNAME, className)}
      tooltip={{ heading: t("common.labels"), emptyContent: t("common.none") }}
      disabled
    />
  );
});
