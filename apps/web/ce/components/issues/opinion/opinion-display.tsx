/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { ThumbsUp, Minus, ThumbsDown } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import type { TOpinionSentiment } from "@plane/types";
import { cn } from "@plane/utils";

type Props = {
  sentiment: TOpinionSentiment;
  content?: string;
  className?: string;
};

const CONFIG: Record<
  TOpinionSentiment,
  { Icon: React.FC<{ className?: string }>; colorClass: string; labelKey: string }
> = {
  approve: { Icon: ThumbsUp, colorClass: "text-green-600 bg-green-500/10", labelKey: "opinion.approve" },
  neutral: { Icon: Minus, colorClass: "text-secondary bg-surface-2", labelKey: "opinion.neutral" },
  reject: { Icon: ThumbsDown, colorClass: "text-red-600 bg-red-500/10", labelKey: "opinion.reject" },
};

export const OpinionDisplay = observer(function OpinionDisplay({ sentiment, content, className }: Props) {
  const { t } = useTranslation();
  const { Icon, colorClass, labelKey } = CONFIG[sentiment];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium border border-subtle",
        colorClass,
        className
      )}
      title={content || t(labelKey)}
    >
      <Icon className="h-3 w-3 flex-shrink-0" />
      {t(labelKey)}
    </span>
  );
});
