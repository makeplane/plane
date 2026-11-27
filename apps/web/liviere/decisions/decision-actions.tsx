/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: the actions of a decision, by its state. Each button is one request to one operation
// of the API (apps/api/plane/liviere/decisions/services.py); the page never builds a change out of several.

import { useState } from "react";
import { Button } from "@makeplane/propel/components/button";
import { useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
import { DecisionChangeForm } from "./decision-change-form";
import { DecisionDatesDialog, DecisionImportFixDialog, DecisionRevokeDialog } from "./decision-dialogs";
import type { TDecisionsContext } from "./decisions-root";
import { decisionsService } from "./decisions.service";
import { ERROR_CODES_WITH_TEXT, availableActions } from "./model";
import type { TCardAction } from "./model";
import type { TDecision, TDecisionAction, TDecisionActionBody, TDecisionError } from "./types";
import { refreshDecisions } from "./use-decisions";

type Props = {
  context: TDecisionsContext;
  decision: TDecision;
};

type TDialog = "defer" | "review" | "postpone" | "revoke" | "reject" | "import-fix" | null;

export function DecisionActions(props: Props) {
  const { context, decision } = props;
  const { t } = useTranslation();
  const [busy, setBusy] = useState<TCardAction | null>(null);
  const [dialog, setDialog] = useState<TDialog>(null);
  // "change": supersede (with a split); "change-accept": accept a proposal in a changed wording
  const [form, setForm] = useState<"change" | "change-accept" | null>(null);

  /** Shows a failed request: the text of the code in the page language, or the server text. */
  const showError = (error: unknown) => {
    const failure = error as TDecisionError;
    const code = failure?.code ?? "";
    const message = (ERROR_CODES_WITH_TEXT as readonly string[]).includes(code)
      ? t(`liviere.decisions.errors.${code}`)
      : (failure?.error ?? t("liviere.decisions.errors.unknown"));
    setToast({ type: "error", title: t("liviere.decisions.errors.title"), message });
    // Turned off or refused meanwhile: reloading puts the page into that state
    if (failure?.status === 403 || failure?.status === 404) void refreshDecisions(context.projectId);
  };

  const run = async <A extends TDecisionAction>(key: TCardAction, action: A, body: TDecisionActionBody[A]) => {
    setBusy(key);
    try {
      await decisionsService.action(context.workspaceSlug, context.projectId, decision.number, action, body);
      await refreshDecisions(context.projectId);
      setDialog(null);
      return true;
    } catch (error) {
      showError(error);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const actions = availableActions(decision);
  if (form)
    return (
      <DecisionChangeForm
        context={context}
        decision={decision}
        mode={form}
        onDone={(opened) => {
          setForm(null);
          if (opened !== null) context.open(opened);
        }}
        onCancel={() => setForm(null)}
        onError={showError}
      />
    );
  if (!actions.length) return null;

  const button = (
    key: TCardAction,
    onClick: () => void,
    variant: "primary" | "secondary" | "danger-outline" = "secondary"
  ) => (
    <Button
      key={key}
      variant={variant}
      size="sm"
      stretch="auto"
      label={t(`liviere.decisions.actions.${key}`)}
      loading={busy === key}
      disabled={busy !== null && busy !== key}
      onClick={onClick}
    />
  );

  const buttons = actions.map((key) => {
    switch (key) {
      case "import-ok":
        return button(key, () => void run(key, "import-review", {}), "primary");
      case "import-fix":
        return button(key, () => setDialog("import-fix"));
      case "confirm":
        return button(key, () => void run(key, "confirm", {}), "primary");
      case "reviewed":
        return button(key, () => setDialog("review"));
      case "change":
        return button(key, () => setForm("change"));
      case "defer":
        return button(key, () => setDialog("defer"));
      case "done":
        return button(key, () => void run(key, "done", {}));
      case "revoke":
        return button(key, () => setDialog("revoke"), "danger-outline");
      case "accept":
        return button(key, () => void run(key, "accept", {}), "primary");
      case "change-accept":
        return button(key, () => setForm("change-accept"));
      case "reject":
        return button(key, () => setDialog("reject"), "danger-outline");
      case "resume":
        return button(key, () => void run(key, "resume", {}), "primary");
      case "postpone":
        return button(key, () => setDialog("postpone"));
      default:
        return null;
    }
  });

  return (
    <>
      <div className="flex flex-wrap gap-2 pt-1">{buttons}</div>
      {(dialog === "defer" || dialog === "review" || dialog === "postpone") && (
        <DecisionDatesDialog
          mode={dialog}
          decision={decision}
          today={context.today}
          submitting={busy !== null}
          onClose={() => setDialog(null)}
          onSubmit={(dates) =>
            void (dialog === "defer"
              ? run("defer", "defer", dates)
              : run(dialog === "postpone" ? "postpone" : "reviewed", "review", dates))
          }
        />
      )}
      {(dialog === "revoke" || dialog === "reject") && (
        <DecisionRevokeDialog
          mode={dialog}
          decision={decision}
          submitting={busy !== null}
          onClose={() => setDialog(null)}
          onSubmit={(reason) => void run(dialog, "revoke", reason ? { reason } : {})}
        />
      )}
      {dialog === "import-fix" && (
        <DecisionImportFixDialog
          decision={decision}
          today={context.today}
          submitting={busy !== null}
          onClose={() => setDialog(null)}
          onSubmit={(fix) => void run("import-fix", "import-review", fix)}
        />
      )}
    </>
  );
}
