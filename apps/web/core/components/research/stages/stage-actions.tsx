/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { TStageInstance, TStageType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";

type Props = {
  stage: TStageInstance;
  isWorkspaceAdmin: boolean;
  onEnter: () => Promise<void>;
  onSubmit: () => Promise<void>;
  onReturn: (reason: string) => Promise<void>;
  onPass: () => Promise<void>;
  onReopen: (reason: string, confirm: boolean) => Promise<void>;
};

/**
 * Stage actions with the mandatory reasons in flow (P1-STG-06, P1-STG-09).
 * Blocking gate items are surfaced by the caller as a structured list, never
 * as a generic failure toast (§6.4).
 */
export const StageActions = observer(function StageActions({
  stage,
  isWorkspaceAdmin,
  onEnter,
  onSubmit,
  onReturn,
  onPass,
  onReopen,
}: Props) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"return" | "reopen" | null>(null);

  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setDialog(null);
      setReason("");
    } catch (error_) {
      setError(getResearchErrorKey(error_));
    } finally {
      setBusy(false);
    }
  }, []);

  const isFinal = stage.stage === ("FINAL" as TStageType);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {stage.status === "NOT_STARTED" && (
          <Button size="sm" variant="primary" disabled={busy} onClick={() => void run(onEnter)}>
            {t("research.stages.action_enter")}
          </Button>
        )}
        {stage.status === "IN_PROGRESS" && (
          <Button size="sm" variant="primary" disabled={busy} onClick={() => void run(onSubmit)}>
            {t("research.stages.action_submit")}
          </Button>
        )}
        {stage.status === "SUBMITTED" && (
          <>
            <Button size="sm" variant="primary" disabled={busy} onClick={() => void run(onPass)}>
              {t("research.stages.action_pass")}
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => setDialog("return")}>
              {t("research.stages.action_return")}
            </Button>
          </>
        )}
        {stage.status === "NEEDS_REVISION" && (
          <Button size="sm" variant="primary" disabled={busy} onClick={() => void run(onEnter)}>
            {t("research.stages.action_reenter")}
          </Button>
        )}
        {stage.status === "PASSED" && isWorkspaceAdmin && (
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => setDialog("reopen")}>
            {t("research.stages.action_reopen")}
          </Button>
        )}
      </div>

      {error && <p className="text-12 text-danger-primary">{t(error)}</p>}

      {dialog && (
        <div className="flex flex-col gap-2 rounded border border-subtle p-2">
          <p className="text-12 text-secondary">
            {dialog === "return" ? t("research.stages.return_reason_hint") : t("research.stages.reopen_reason_hint")}
          </p>
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("research.stages.reason_placeholder")}
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              disabled={busy || !reason.trim()}
              onClick={() => void run(() => (dialog === "return" ? onReturn(reason) : onReopen(reason, isFinal)))}
            >
              {t("research.common.confirm")}
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => setDialog(null)}>
              {t("research.common.cancel")}
            </Button>
            {dialog === "reopen" && isFinal && (
              <span className="text-11 text-tertiary">{t("research.stages.reopen_final_hint")}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
