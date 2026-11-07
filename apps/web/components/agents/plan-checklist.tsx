/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { CheckSquareOutline, CircleDashedOutline, CircleOutline } from "@makeplane/propel/icons";
import type { PlanEntry } from "@plane/acp-client";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// local imports
import { keyedByContent } from "./helpers";

const STATUS_ICONS = {
  pending: CircleOutline,
  in_progress: CircleDashedOutline,
  completed: CheckSquareOutline,
} as const;

type Props = { entries: readonly PlanEntry[] };

/** The agent's current plan (ACP `plan` updates replace it as a whole). */
export function PlanChecklist({ entries }: Props) {
  const { t } = useTranslation();
  const done = entries.filter((entry) => entry.status === "completed").length;
  return (
    <section aria-labelledby="agent-plan-title" className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="agent-plan-title" className="text-body-xs-medium text-primary">
          {t("agents.plan.title")}
        </h2>
        <span className="text-caption-md-regular text-tertiary">
          {t("agents.plan.progress", { done, total: entries.length })}
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {keyedByContent(entries, (entry) => entry.content).map(({ key, item: entry }) => {
          const Icon = STATUS_ICONS[entry.status] ?? CircleOutline;
          return (
            <li key={key} className="flex items-start gap-2 text-caption-md-regular">
              <Icon
                aria-hidden
                className={cn(
                  "mt-0.5 size-3.5 flex-shrink-0",
                  entry.status === "completed" ? "text-success-primary" : "text-tertiary"
                )}
              />
              <span className={cn(entry.status === "completed" ? "text-tertiary line-through" : "text-secondary")}>
                <span className="sr-only">{t(`agents.tool_call.status.${entry.status}`)}: </span>
                {entry.content}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
