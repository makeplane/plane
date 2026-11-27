/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: "Change" of a decision. One request in either mode:
// - "change": POST supersede/ with one new version, or several ({decisions: [..]}, a split); the new
//   versions are in force at once, the old one stays in the chain as superseded;
// - "change-accept": a proposal accepted in a changed wording, POST accept/ {title, rationale}.

import { useState } from "react";
import { Button } from "@makeplane/propel/components/button";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { useTranslation } from "@plane/i18n";
import type { TDecisionsContext } from "./decisions-root";
import { decisionsService } from "./decisions.service";
import { SPLIT_MAX, TEXT_MAX_LENGTH, TITLE_MAX_LENGTH, versionsToSend } from "./model";
import type { TVersionDraft } from "./model";
import type { TDecision } from "./types";
import { refreshDecisions } from "./use-decisions";

type Props = {
  context: TDecisionsContext;
  decision: TDecision;
  mode: "change" | "change-accept";
  // The decision to open afterwards (the first new version, or the accepted proposal); null: none
  onDone: (opened: number | null) => void;
  onCancel: () => void;
  onError: (error: unknown) => void;
};

export function DecisionChangeForm(props: Props) {
  const { context, decision, mode, onDone, onCancel, onError } = props;
  const { t } = useTranslation();
  const [drafts, setDrafts] = useState<TVersionDraft[]>([
    { title: decision.title, rationale: mode === "change-accept" ? (decision.rationale ?? "") : "" },
  ]);
  const [saving, setSaving] = useState(false);
  const versions = versionsToSend(drafts);
  const unchanged =
    mode === "change-accept" &&
    drafts[0].title.trim() === decision.title &&
    drafts[0].rationale.trim() === (decision.rationale ?? "");
  const update = (index: number, field: keyof TVersionDraft, value: string) =>
    setDrafts((current) =>
      current.map((draft, position) => (position === index ? { ...draft, [field]: value } : draft))
    );

  const submit = async () => {
    if (!versions || saving) return;
    setSaving(true);
    try {
      let opened: number | null;
      if (mode === "change") {
        const result = await decisionsService.supersede(
          context.workspaceSlug,
          context.projectId,
          decision.number,
          versions
        );
        opened = result?.created?.[0]?.number ?? null;
      } else {
        await decisionsService.action(context.workspaceSlug, context.projectId, decision.number, "accept", {
          title: versions[0].title,
          ...(versions[0].rationale ? { rationale: versions[0].rationale } : {}),
        });
        opened = decision.number;
      }
      await refreshDecisions(context.projectId);
      onDone(opened);
    } catch (error) {
      onError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-3 rounded-md border border-subtle bg-layer-1 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {drafts.map((draft, index) => (
        // The drafts only grow at the end and shrink by their own button, so the position is stable
        // oxlint-disable-next-line no-array-index-key
        <fieldset key={index} className="flex flex-col gap-2">
          {drafts.length > 1 && (
            <legend className="flex w-full items-center justify-between text-12 font-medium text-tertiary">
              {t("liviere.decisions.change.version", { index: index + 1 })}
              <button
                type="button"
                className="text-12 text-danger-primary hover:underline"
                onClick={() => setDrafts((current) => current.filter((_, position) => position !== index))}
              >
                {t("liviere.decisions.change.remove")}
              </button>
            </legend>
          )}
          <TextAreaField
            size="lg"
            name={`title-${index}`}
            label={t("liviere.decisions.change.title")}
            value={draft.title}
            onChange={(event) => update(index, "title", event.target.value)}
            maxLength={TITLE_MAX_LENGTH}
            required
            resize="vertical"
            rows={2}
          />
          <TextAreaField
            size="lg"
            name={`rationale-${index}`}
            label={t(mode === "change" ? "liviere.decisions.change.why_change" : "liviere.decisions.change.why")}
            value={draft.rationale}
            onChange={(event) => update(index, "rationale", event.target.value)}
            maxLength={TEXT_MAX_LENGTH}
            resize="vertical"
            rows={2}
          />
        </fieldset>
      ))}
      {mode === "change" && drafts.length < SPLIT_MAX && (
        <button
          type="button"
          className="w-fit text-13 text-accent-primary hover:underline"
          onClick={() => setDrafts((current) => [...current, { title: "", rationale: "" }])}
        >
          {t("liviere.decisions.change.add_version")}
        </button>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          stretch="auto"
          type="submit"
          loading={saving}
          disabled={!versions || unchanged}
          label={t(mode === "change" ? "liviere.decisions.change.save" : "liviere.decisions.change.save_accept")}
        />
        <Button variant="secondary" size="sm" stretch="auto" type="button" onClick={onCancel} label={t("cancel")} />
      </div>
      <p className="text-12 text-tertiary">
        {t(
          mode === "change"
            ? drafts.length > 1
              ? "liviere.decisions.change.hint_split"
              : "liviere.decisions.change.hint"
            : "liviere.decisions.change.hint_accept"
        )}
      </p>
    </form>
  );
}
