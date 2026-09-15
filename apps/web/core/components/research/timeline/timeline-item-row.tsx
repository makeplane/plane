/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { INTEGRATION_SYSTEM_LABELS, TIMELINE_KIND_LABELS } from "@plane/constants";
import type { TTimelineItem } from "@plane/constants";
import { useTranslation } from "@plane/i18n";

type Props = {
  item: TTimelineItem;
};

/** One timeline node; external nodes link out instead of opening a Plane page. */
export const TimelineItemRow = observer(function TimelineItemRow({ item }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-0.5 rounded border border-subtle px-3 py-2 text-12">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-primary">
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-11 text-tertiary">
            {t(TIMELINE_KIND_LABELS[item.kind])}
          </span>
          {item.source_system && (
            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-11 text-secondary">
              {t(INTEGRATION_SYSTEM_LABELS[item.source_system as keyof typeof INTEGRATION_SYSTEM_LABELS] ?? "")}
            </span>
          )}
          <span>{item.title}</span>
          {item.degraded && (
            <span className="rounded bg-danger-subtle px-1.5 py-0.5 text-11 text-danger-primary">
              {t("research.integrations.degraded_hint")}
            </span>
          )}
        </span>
        <span className="text-11 text-tertiary">{item.at ? new Date(item.at).toLocaleString() : ""}</span>
      </div>
      {item.source_url && (
        <a
          className="text-11 text-accent-primary hover:underline"
          href={item.source_url}
          target="_blank"
          rel="noreferrer"
        >
          {t("research.integrations.open_source")}
        </a>
      )}
    </div>
  );
});
