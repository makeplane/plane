/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TranscriptUsage } from "@plane/acp-client";
import { useTranslation } from "@plane/i18n";

type Props = { usage: TranscriptUsage };

const formatCount = (value: number) => value.toLocaleString();

/** Context window use (and cost, when the agent reports it). */
export function UsageMeter({ usage }: Props) {
  const { t } = useTranslation();
  const percent = usage.size > 0 ? Math.min(100, Math.round((usage.used / usage.size) * 100)) : 0;
  const label = t("agents.usage.context", { used: formatCount(usage.used), size: formatCount(usage.size) });
  return (
    <div className="flex flex-col gap-1">
      {/* The native meter carries the semantics; the bar is its styled, decorative twin. */}
      <meter className="sr-only" min={0} max={usage.size} value={usage.used} aria-label={label} />
      <div aria-hidden className="h-1 w-full overflow-hidden rounded-full bg-layer-3">
        <div className="h-full rounded-full bg-accent-primary" style={{ width: `${percent}%` }} />
      </div>
      <p aria-hidden className="text-caption-sm-regular text-tertiary">
        {label}
      </p>
      {usage.cost && (
        <p className="text-caption-sm-regular text-tertiary">
          {t("agents.usage.cost", { amount: usage.cost.amount.toFixed(2), currency: usage.cost.currency })}
        </p>
      )}
    </div>
  );
}
