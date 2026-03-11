/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { RefreshCw } from "lucide-react";
import { ISSUE_FREQUENCIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ChevronDownIcon } from "@plane/propel/icons";
import type { TIssueFrequency } from "@plane/types";
import { cn } from "@plane/utils";

type Props = {
  className?: string;
  dropdownArrow: boolean;
  dropdownArrowClassName: string;
  hideText?: boolean;
  placeholder: string;
  value: TIssueFrequency | null | undefined;
};

export function FrequencyButtonContent(props: Props) {
  const { className, dropdownArrow, dropdownArrowClassName, hideText = false, placeholder, value } = props;
  const { t } = useTranslation();

  const frequencyItem = ISSUE_FREQUENCIES.find((f) => f.key === value);

  return (
    <div className={cn("h-full w-full flex items-center gap-1.5 rounded-sm px-2", className)}>
      {value && frequencyItem ? (
        <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: frequencyItem.color }} />
      ) : (
        <RefreshCw className="size-3 flex-shrink-0 text-placeholder" />
      )}
      {!hideText && (
        <span
          className={cn("flex-grow truncate text-body-xs-medium", {
            "text-secondary": !!value,
            "text-placeholder": !value,
          })}
        >
          {frequencyItem?.title ?? placeholder ?? t("common.frequency")}
        </span>
      )}
      {dropdownArrow && (
        <ChevronDownIcon className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
      )}
    </div>
  );
}
