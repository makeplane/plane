/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { STAGE_TRANSITION_ACTION_LABELS, STAGE_STATUS_LABELS } from "@plane/constants";
import type { TStageTransition } from "@plane/constants";
import { useTranslation } from "@plane/i18n";

type Props = {
  transitions: TStageTransition[];
};

/** Append-only transition history; reasons are shown but never editable (P1-STG-10). */
export const StageTransitionHistory = observer(function StageTransitionHistory({ transitions }: Props) {
  const { t } = useTranslation();

  if (!transitions.length) {
    return <p className="text-12 text-tertiary">{t("research.stages.history_empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {transitions.map((transition) => (
        <div key={transition.id} className="flex flex-col gap-0.5 rounded border border-subtle px-2 py-1.5 text-12">
          <div className="flex items-center justify-between gap-2">
            <span className="text-primary">
              {t(STAGE_TRANSITION_ACTION_LABELS[transition.action] ?? transition.action)}
              {` · ${t(STAGE_STATUS_LABELS[transition.from_status] ?? transition.from_status)} → ${t(
                STAGE_STATUS_LABELS[transition.to_status] ?? transition.to_status
              )}`}
            </span>
            <span className="text-11 text-tertiary">{new Date(transition.created_at).toLocaleString()}</span>
          </div>
          {transition.reason && <span className="text-tertiary">{transition.reason}</span>}
        </div>
      ))}
    </div>
  );
});
