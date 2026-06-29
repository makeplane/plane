/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import type { TMailFilterRule } from "@plane/types";
import { useMail } from "@/hooks/store/use-mail";
import {
  Card,
  EmptyState,
  FieldLabel,
  MailToggle,
  PrimaryButton,
  SecondaryButton,
  SelectField,
  SettingsHeader,
  TextField,
} from "./primitives";

type StoredCondition = { field?: string; op?: string; value?: string };
type StoredAction = { type?: string; value?: string };
type Condition = { id: string; field: string; op: string; value: string };
type Action = { id: string; type: string; value: string };
type Draft = {
  name: string;
  is_active: boolean;
  match_type: "all" | "any";
  conditions: Condition[];
  actions: Action[];
};

const FIELD_OPTIONS = ["from", "to", "subject", "body"];
const ACTION_OPTIONS = ["label", "mark_read", "skip_inbox", "star", "mark_important", "move_spam"];

let draftItemCounter = 0;

const draftItemId = () => `mail-filter-draft-${draftItemCounter++}`;
const emptyCondition = (): Condition => ({ id: draftItemId(), field: "from", op: "contains", value: "" });
const emptyAction = (): Action => ({ id: draftItemId(), type: "label", value: "" });

const createDefaultDraft = (): Draft => ({
  name: "",
  is_active: true,
  match_type: "all",
  conditions: [emptyCondition()],
  actions: [emptyAction()],
});

const toDraft = (rule: TMailFilterRule): Draft => ({
  name: rule.name,
  is_active: rule.is_active,
  match_type: rule.match_type ?? "all",
  conditions: (rule.conditions as StoredCondition[] | undefined)?.length
    ? (rule.conditions as StoredCondition[]).map((c) => ({
        id: draftItemId(),
        field: c.field ?? "from",
        op: c.op ?? "contains",
        value: c.value ?? "",
      }))
    : [emptyCondition()],
  actions: (rule.actions as StoredAction[] | undefined)?.length
    ? (rule.actions as StoredAction[]).map((a) => ({
        id: draftItemId(),
        type: a.type ?? "label",
        value: a.value ?? "",
      }))
    : [emptyAction()],
});

export const MailFiltersSettings = observer(function MailFiltersSettings() {
  const { t } = useTranslation();
  const mail = useMail();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(createDefaultDraft);
  const [saving, setSaving] = useState(false);

  const isEditing = creating || editingId !== null;

  const startCreate = () => {
    setCreating(true);
    setEditingId(null);
    setDraft(createDefaultDraft());
  };
  const startEdit = (rule: TMailFilterRule) => {
    setCreating(false);
    setEditingId(rule.id);
    setDraft(toDraft(rule));
  };
  const cancel = () => {
    setCreating(false);
    setEditingId(null);
    setDraft(createDefaultDraft());
  };

  const save = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    const payload = {
      name: draft.name,
      is_active: draft.is_active,
      match_type: draft.match_type,
      conditions: draft.conditions.filter((c) => c.value.trim()).map(({ field, op, value }) => ({ field, op, value })),
      actions: draft.actions.filter((a) => a.type).map(({ type, value }) => ({ type, value })),
    } as Partial<TMailFilterRule>;
    try {
      if (editingId) await mail.updateFilter(editingId, payload);
      else await mail.createFilter(payload);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("mail.settings.toasts.saved") });
      cancel();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("mail.settings.toasts.error") });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await mail.deleteFilter(id);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("mail.settings.toasts.deleted") });
      if (editingId === id) cancel();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("mail.settings.toasts.error") });
    }
  };

  const toggleActive = async (rule: TMailFilterRule) => {
    try {
      await mail.updateFilter(rule.id, { is_active: !rule.is_active });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("mail.settings.toasts.error") });
    }
  };

  const summarize = (items: { value?: string; type?: string }[], kind: "cond" | "act") =>
    items
      .map((item) => (kind === "cond" ? item.value : t(`mail.settings.filters.actions.${item.type}`)))
      .filter(Boolean)
      .join(", ");

  return (
    <div className="max-w-2xl">
      <SettingsHeader
        title={t("mail.settings.tabs.filters")}
        description={t("mail.settings.filters.subtitle")}
        action={
          !isEditing ? (
            <PrimaryButton onClick={startCreate}>
              <Plus className="size-4" /> {t("mail.settings.filters.new")}
            </PrimaryButton>
          ) : undefined
        }
      />

      {isEditing ? (
        <Card className="p-5">
          <FieldLabel>{t("mail.settings.filters.name")}</FieldLabel>
          <TextField
            value={draft.name}
            placeholder={t("mail.settings.filters.name_placeholder")}
            onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
          />

          <div className="text-sm mt-5 flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[var(--mail-muted)] uppercase">
              {t("mail.settings.filters.if")}
            </span>
            <SelectField
              value={draft.match_type}
              onChange={(event) => setDraft((prev) => ({ ...prev, match_type: event.target.value as "all" | "any" }))}
            >
              <option value="all">{t("mail.settings.filters.match_all")}</option>
              <option value="any">{t("mail.settings.filters.match_any")}</option>
            </SelectField>
          </div>

          <div className="mt-3 space-y-2">
            {draft.conditions.map((condition, index) => (
              <div key={condition.id} className="flex items-center gap-2">
                <SelectField
                  value={condition.field}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      conditions: prev.conditions.map((c, i) =>
                        i === index ? { ...c, field: event.target.value } : c
                      ),
                    }))
                  }
                >
                  {FIELD_OPTIONS.map((field) => (
                    <option key={field} value={field}>
                      {t(`mail.settings.filters.fields.${field}`)}
                    </option>
                  ))}
                </SelectField>
                <span className="text-sm text-[var(--mail-muted)]">{t("mail.settings.filters.contains")}</span>
                <TextField
                  className="flex-1"
                  value={condition.value}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      conditions: prev.conditions.map((c, i) =>
                        i === index ? { ...c, value: event.target.value } : c
                      ),
                    }))
                  }
                />
                {draft.conditions.length > 1 && (
                  <button
                    type="button"
                    className="grid size-8 flex-shrink-0 place-items-center rounded-md text-[var(--mail-muted)] hover:text-[var(--mail-accent)]"
                    onClick={() =>
                      setDraft((prev) => ({ ...prev, conditions: prev.conditions.filter((_, i) => i !== index) }))
                    }
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="text-sm flex items-center gap-1.5 font-medium text-[var(--mail-accent)]"
              onClick={() => setDraft((prev) => ({ ...prev, conditions: [...prev.conditions, emptyCondition()] }))}
            >
              <Plus className="size-3.5" /> {t("mail.settings.filters.add_condition")}
            </button>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[var(--mail-muted)] uppercase">
              {t("mail.settings.filters.then_label")}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {draft.actions.map((action, index) => (
              <div key={action.id} className="flex items-center gap-2">
                <SelectField
                  value={action.type}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      actions: prev.actions.map((a, i) => (i === index ? { ...a, type: event.target.value } : a)),
                    }))
                  }
                >
                  {ACTION_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {t(`mail.settings.filters.actions.${type}`)}
                    </option>
                  ))}
                </SelectField>
                {action.type === "label" && (
                  <SelectField
                    className="flex-1"
                    value={action.value}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        actions: prev.actions.map((a, i) => (i === index ? { ...a, value: event.target.value } : a)),
                      }))
                    }
                  >
                    <option value="">{t("mail.settings.filters.choose_label")}</option>
                    {mail.labels.map((label) => (
                      <option key={label.id} value={label.id}>
                        {label.name}
                      </option>
                    ))}
                  </SelectField>
                )}
                {draft.actions.length > 1 && (
                  <button
                    type="button"
                    className="grid size-8 flex-shrink-0 place-items-center rounded-md text-[var(--mail-muted)] hover:text-[var(--mail-accent)]"
                    onClick={() =>
                      setDraft((prev) => ({ ...prev, actions: prev.actions.filter((_, i) => i !== index) }))
                    }
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="text-sm flex items-center gap-1.5 font-medium text-[var(--mail-accent)]"
              onClick={() => setDraft((prev) => ({ ...prev, actions: [...prev.actions, emptyAction()] }))}
            >
              <Plus className="size-3.5" /> {t("mail.settings.filters.add_action")}
            </button>
          </div>

          <label className="mt-5 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--mail-ink)]">{t("mail.settings.filters.active")}</span>
            <MailToggle
              value={draft.is_active}
              onChange={(value) => setDraft((prev) => ({ ...prev, is_active: value }))}
            />
          </label>

          <div className="mt-5 flex gap-3">
            <PrimaryButton onClick={save} disabled={saving || !draft.name.trim()}>
              {t("mail.settings.save")}
            </PrimaryButton>
            <SecondaryButton onClick={cancel}>{t("mail.settings.cancel")}</SecondaryButton>
          </div>
        </Card>
      ) : mail.filters.length ? (
        <div className="space-y-3">
          {mail.filters.map((rule) => (
            <Card key={rule.id} className={rule.is_active ? "p-4" : "p-4 opacity-60"}>
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[var(--mail-ink)]">{rule.name}</div>
                  <div className="text-xs mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[var(--mail-muted)]">
                    <span className="font-mono font-semibold">{t("mail.settings.filters.if")}</span>
                    <span className="text-[var(--mail-ink)]">{summarize(rule.conditions as Condition[], "cond")}</span>
                    <span className="font-mono font-semibold">{t("mail.settings.filters.then_label")}</span>
                    <span className="text-[var(--mail-ink)]">{summarize(rule.actions as Action[], "act")}</span>
                  </div>
                </div>
                <MailToggle value={rule.is_active} onChange={() => toggleActive(rule)} />
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-md text-[var(--mail-muted)] hover:bg-[var(--mail-hover)] hover:text-[var(--mail-ink)]"
                  onClick={() => startEdit(rule)}
                  title={t("mail.settings.edit")}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-md text-[var(--mail-muted)] hover:bg-[var(--mail-hover)] hover:text-[var(--mail-accent)]"
                  onClick={() => remove(rule.id)}
                  title={t("mail.settings.delete")}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState>{t("mail.settings.filters.empty")}</EmptyState>
      )}
    </div>
  );
});
