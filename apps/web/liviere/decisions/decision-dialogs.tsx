/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: dialogs of the decision actions: defer or review dates, revoke and reject (with a
// confirmation), and the correction of an imported decision. Each submits one request.

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Button } from "@makeplane/propel/components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { InputField } from "@makeplane/propel/components/input-field";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { useTranslation } from "@plane/i18n";
import { IMPORT_FIX_STATUSES, addDays, importFixChange, importFixNeedsReturn } from "./model";
import type { TImportFix } from "./model";
import type { TDecision } from "./types";

// Limits of the API (decisions/rules.py)
const CONDITION_MAX_LENGTH = 500;
const REASON_MAX_LENGTH = 2000;
// The suggested date of a deferral or the next review
const SUGGESTED_DAYS = 30;

const selectClass = "h-9 w-full rounded-md border border-subtle bg-surface-1 px-2 text-13 text-primary";

function DecisionDialog(props: {
  title: string;
  submitLabel: string;
  submitVariant?: "primary" | "danger";
  submitting: boolean;
  canSubmit: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
}) {
  const { title, submitLabel, submitVariant = "primary", submitting, canSubmit, onClose, onSubmit, children } = props;
  const { t } = useTranslation();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (canSubmit && !submitting) onSubmit();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent size="md">
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DialogMain>
            <DialogHeader>
              <DialogHeading>
                <DialogTitle>{title}</DialogTitle>
              </DialogHeading>
            </DialogHeader>
            <DialogBody>
              <div className="flex flex-col gap-4 text-13">{children}</div>
            </DialogBody>
          </DialogMain>
          <DialogActions>
            <Button variant="secondary" size="md" stretch="auto" type="button" onClick={onClose} label={t("cancel")} />
            <Button
              variant={submitVariant}
              size="md"
              stretch="auto"
              type="submit"
              loading={submitting}
              disabled={!canSubmit}
              label={submitLabel}
            />
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type TDatesMode = "defer" | "review" | "postpone";
export type TDates = { review_on: string | null; review_condition: string | null };

/**
 * Dates of a decision: a deferral (`defer/`, a date or a condition required), the review of an active one
 * (`review/`, both may stay empty: no further review) or moving the return of a deferred one (`review/`).
 */
export function DecisionDatesDialog(props: {
  mode: TDatesMode;
  decision: TDecision;
  today: string | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (dates: TDates) => void;
}) {
  const { mode, decision, today, submitting, onClose, onSubmit } = props;
  const { t } = useTranslation();
  const suggested = today ? addDays(today, SUGGESTED_DAYS) : "";
  const [date, setDate] = useState(mode === "review" ? "" : suggested);
  const [condition, setCondition] = useState(mode === "review" ? "" : (decision.review_condition ?? ""));
  const needsOne = mode !== "review";
  const canSubmit = !needsOne || !!date || !!condition.trim();
  return (
    <DecisionDialog
      title={t(`liviere.decisions.dialogs.${mode}.title`, { number: decision.identifier })}
      submitLabel={t(`liviere.decisions.dialogs.${mode}.submit`)}
      submitting={submitting}
      canSubmit={canSubmit}
      onClose={onClose}
      onSubmit={() => onSubmit({ review_on: date || null, review_condition: condition.trim() || null })}
    >
      <p className="text-secondary">{t(`liviere.decisions.dialogs.${mode}.description`)}</p>
      <div className="w-48">
        <InputField
          size="md"
          orientation="vertical"
          name="review_on"
          type="date"
          label={t(`liviere.decisions.dialogs.${mode === "review" ? "review" : "defer"}.date`)}
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>
      <TextAreaField
        size="lg"
        name="review_condition"
        label={t("liviere.decisions.dialogs.condition")}
        placeholder={t("liviere.decisions.dialogs.condition_placeholder")}
        value={condition}
        onChange={(event) => setCondition(event.target.value)}
        maxLength={CONDITION_MAX_LENGTH}
        resize="vertical"
        rows={2}
      />
      {needsOne && !canSubmit && (
        <p className="text-12 text-tertiary">{t("liviere.decisions.dialogs.date_or_condition")}</p>
      )}
    </DecisionDialog>
  );
}

/** Revoking a decision in force (optional reason) or rejecting a proposal: both ask for a confirmation. */
export function DecisionRevokeDialog(props: {
  mode: "revoke" | "reject";
  decision: TDecision;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const { mode, decision, submitting, onClose, onSubmit } = props;
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  return (
    <DecisionDialog
      title={t(`liviere.decisions.dialogs.${mode}.title`, { number: decision.identifier })}
      submitLabel={t(`liviere.decisions.dialogs.${mode}.submit`)}
      submitVariant="danger"
      submitting={submitting}
      canSubmit
      onClose={onClose}
      onSubmit={() => onSubmit(reason.trim())}
    >
      <p className="text-secondary">{t(`liviere.decisions.dialogs.${mode}.description`)}</p>
      <blockquote className="border-l-2 border-subtle pl-3 text-primary">{decision.title}</blockquote>
      <TextAreaField
        size="lg"
        name="reason"
        label={t("liviere.decisions.dialogs.reason")}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        maxLength={REASON_MAX_LENGTH}
        resize="vertical"
        rows={3}
      />
    </DecisionDialog>
  );
}

/**
 * Correction of an imported decision: author, date and state, and for a deferred one the date or condition of its
 * return (required when it becomes deferred), sent as one `import-review/`.
 */
export function DecisionImportFixDialog(props: {
  decision: TDecision;
  today: string | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (fix: TImportFix) => void;
}) {
  const { decision, today, submitting, onClose, onSubmit } = props;
  const { t } = useTranslation();
  const [author, setAuthor] = useState<"user" | "agent" | "">(
    decision.decided_by === "unknown" ? "" : decision.decided_by
  );
  const [date, setDate] = useState(decision.decided_on ?? "");
  const [status, setStatus] = useState(decision.status);
  // The return as it is, or the suggestion of "Defer" once the decision becomes deferred
  const [reviewOn, setReviewOn] = useState(decision.review_on ?? "");
  const [reviewCondition, setReviewCondition] = useState(decision.review_condition ?? "");
  const statusAllowed = (IMPORT_FIX_STATUSES as readonly string[]).includes(decision.status);
  const form = { author, date, status, reviewOn, reviewCondition };
  const change = importFixChange(decision, form);
  const chooseStatus = (value: TDecision["status"]) => {
    setStatus(value);
    if (value === "deferred" && decision.status !== "deferred" && !reviewOn && !reviewCondition && today)
      setReviewOn(addDays(today, SUGGESTED_DAYS));
  };
  return (
    <DecisionDialog
      title={t("liviere.decisions.dialogs.import_fix.title", { number: decision.identifier })}
      submitLabel={t("liviere.decisions.dialogs.import_fix.submit")}
      submitting={submitting}
      canSubmit={change !== null}
      onClose={onClose}
      onSubmit={() => change && onSubmit(change)}
    >
      <p className="text-secondary">{t("liviere.decisions.dialogs.import_fix.description")}</p>
      <label className="flex flex-col gap-1 text-tertiary">
        {t("liviere.decisions.dialogs.import_fix.author")}
        <select
          className={selectClass}
          value={author}
          required
          onChange={(event) => setAuthor(event.target.value as "user" | "agent" | "")}
        >
          {author === "" && <option value="">{t("liviere.decisions.dialogs.import_fix.pick_author")}</option>}
          <option value="user">{t("liviere.decisions.dialogs.import_fix.author_user")}</option>
          <option value="agent">{t("liviere.decisions.dialogs.import_fix.author_agent")}</option>
        </select>
      </label>
      <div className="w-48">
        <InputField
          size="md"
          orientation="vertical"
          name="decided_on"
          type="date"
          label={t("liviere.decisions.dialogs.import_fix.date")}
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>
      {statusAllowed && (
        <label className="flex flex-col gap-1 text-tertiary">
          {t("liviere.decisions.dialogs.import_fix.status")}
          <select
            className={selectClass}
            value={status}
            onChange={(event) => chooseStatus(event.target.value as TDecision["status"])}
          >
            {IMPORT_FIX_STATUSES.map((value) => (
              <option key={value} value={value}>
                {t(`liviere.decisions.status.${value}`)}
              </option>
            ))}
          </select>
        </label>
      )}
      {statusAllowed && status === "deferred" && (
        <>
          <div className="w-48">
            <InputField
              size="md"
              orientation="vertical"
              name="review_on"
              type="date"
              label={t("liviere.decisions.dialogs.defer.date")}
              value={reviewOn}
              onChange={(event) => setReviewOn(event.target.value)}
            />
          </div>
          <TextAreaField
            size="lg"
            name="review_condition"
            label={t("liviere.decisions.dialogs.condition")}
            placeholder={t("liviere.decisions.dialogs.condition_placeholder")}
            value={reviewCondition}
            onChange={(event) => setReviewCondition(event.target.value)}
            maxLength={CONDITION_MAX_LENGTH}
            resize="vertical"
            rows={2}
          />
          {importFixNeedsReturn(decision, form) && (
            <p className="text-12 text-tertiary">{t("liviere.decisions.dialogs.date_or_condition")}</p>
          )}
        </>
      )}
      {decision.decided_by === "unknown" && author === "" && (
        <p className="text-12 text-tertiary">{t("liviere.decisions.dialogs.import_fix.author_required")}</p>
      )}
    </DecisionDialog>
  );
}
