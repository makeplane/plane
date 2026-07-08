/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Mail } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { EInboxIssueSource } from "@plane/types";

export type TInboxSourcePill = {
  source: EInboxIssueSource;
  sourceEmail?: string;
};

export function InboxSourcePill(props: TInboxSourcePill) {
  const { source, sourceEmail } = props;
  // hooks
  const { t } = useTranslation();

  if (source !== EInboxIssueSource.EMAIL) return null;

  return (
    <Tooltip tooltipContent={sourceEmail} disabled={!sourceEmail}>
      <div className="relative flex h-[17.5px] items-center gap-1 rounded-sm border border-strong px-1 text-11 font-medium text-secondary">
        <Mail className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">{t("email")}</span>
      </div>
    </Tooltip>
  );
}
