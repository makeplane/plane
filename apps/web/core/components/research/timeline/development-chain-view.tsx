/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import type { TTimelineItem } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { TimelineItemRow } from "@/components/research/timeline/timeline-item-row";

type Props = {
  items: TTimelineItem[];
};

/** Production chain: experiments → code → results → papers. */
export const DevelopmentChainView = observer(function DevelopmentChainView({ items }: Props) {
  const { t } = useTranslation();
  if (!items.length) return <p className="text-12 text-tertiary">{t("research.timeline.empty")}</p>;
  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <TimelineItemRow key={`${item.kind}-${item.target_id ?? item.title}`} item={item} />
      ))}
    </div>
  );
});
