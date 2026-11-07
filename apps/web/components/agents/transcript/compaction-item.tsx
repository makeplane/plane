/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Collapsible } from "@makeplane/propel/components/collapsible";
import { HistoryOutline } from "@makeplane/propel/icons";
import type { CompactionItem as TCompactionItem } from "@plane/acp-client";
import { useTranslation } from "@plane/i18n";

type Props = { item: TCompactionItem };

const STATUS_KEYS: Record<string, string> = {
  in_progress: "agents.transcript.compaction.in_progress",
  completed: "agents.transcript.compaction.completed",
  failed: "agents.transcript.compaction.failed",
};

/** The agent summarized earlier messages to free context. */
export function CompactionItem({ item }: Props) {
  const { t } = useTranslation();
  const label = t(STATUS_KEYS[item.status] ?? STATUS_KEYS.completed);
  if (!item.summary && !item.error) {
    return <p className="text-caption-md-regular text-tertiary">{label}</p>;
  }
  return (
    <Collapsible
      icon={<HistoryOutline className="size-4 text-tertiary" />}
      trigger={<span className="text-caption-md-regular text-tertiary">{label}</span>}
    >
      <p className="border-l-2 border-subtle pl-3 text-caption-md-regular whitespace-pre-wrap text-secondary">
        {item.error ?? item.summary}
      </p>
    </Collapsible>
  );
}
