/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import type { TStageGate } from "@plane/constants";
import { useTranslation } from "@plane/i18n";

type Props = {
  gate?: TStageGate;
  onRefresh?: () => void;
};

/**
 * Gate checklist: every item shows what was required, what was found and why
 * it blocks (P1-STG-06). The list is produced by the backend rule engine, so
 * the pre-check and the submission decision always agree.
 */
export const StageGateChecklist = observer(function StageGateChecklist({ gate }: Props) {
  const { t } = useTranslation();
  if (!gate) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-13 font-medium text-primary">{t("research.stages.gate.title")}</h3>
        <span
          className={`rounded px-1.5 py-0.5 text-11 ${
            gate.result === "PASS" ? "bg-success-subtle text-success-primary" : "bg-danger-subtle text-danger-primary"
          }`}
        >
          {t(`research.stages.gate.result_${gate.result.toLowerCase()}`)}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {gate.items.map((item) => (
          <div key={item.code} className="flex flex-col gap-0.5 rounded border border-subtle px-2 py-1.5 text-12">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className={item.passed ? "text-success-primary" : "text-danger-primary"}>
                  {item.passed ? "●" : "○"}
                </span>
                <span className="text-primary">{t(item.label_key)}</span>
                {item.applies_to.includes("pass") && (
                  <span className="rounded bg-surface-2 px-1 text-11 text-tertiary">
                    {t("research.stages.gate.applies_to_pass")}
                  </span>
                )}
                {!item.available && (
                  <span className="rounded bg-surface-2 px-1 text-11 text-tertiary">
                    {t("research.stages.gate.unavailable")}
                  </span>
                )}
              </span>
              <span className="text-tertiary">
                {item.actual === null ? "-" : item.actual} / {item.required}
              </span>
            </div>
            {!item.passed && item.blocking && (
              <span className="text-tertiary">
                {t("research.stages.gate.blocked_hint")}
                {item.missing?.length ? `: ${item.missing.join(", ")}` : ""}
                {item.pending_required_roles?.length ? `: ${item.pending_required_roles.join(", ")}` : ""}
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="text-11 text-tertiary">
        {t("research.stages.gate.rule_version_hint", { version: gate.rule_version })}
      </p>
    </div>
  );
});
