/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronLeft, FileText, Plus, Trash2 } from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import type { TMailTemplate } from "@plane/types";
import { useMail } from "@/hooks/store/use-mail";
import {
  Card,
  EmptyState,
  FieldLabel,
  PrimaryButton,
  SecondaryButton,
  SettingsHeader,
  TextArea,
  TextField,
} from "./primitives";

type Draft = { name: string; category: string; subject: string; body_text: string };

const DEFAULT_DRAFT: Draft = { name: "", category: "", subject: "", body_text: "" };

export const MailTemplatesSettings = observer(function MailTemplatesSettings() {
  const { t } = useTranslation();
  const mail = useMail();
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT);
  const [saving, setSaving] = useState(false);

  const startCreate = () => {
    setEditingId(null);
    setDraft(DEFAULT_DRAFT);
    setMode("edit");
  };

  const startEdit = (template: TMailTemplate) => {
    setEditingId(template.id);
    setDraft({
      name: template.name,
      category: template.category,
      subject: template.subject,
      body_text: template.body_text,
    });
    setMode("edit");
  };

  const save = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) await mail.updateTemplate(editingId, draft);
      else await mail.createTemplate(draft);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("mail.settings.toasts.saved") });
      setMode("list");
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("mail.settings.toasts.error") });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await mail.deleteTemplate(id);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("mail.settings.toasts.deleted") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("mail.settings.toasts.error") });
    }
  };

  if (mode === "edit") {
    return (
      <div className="max-w-2xl">
        <button
          type="button"
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-[var(--mail-accent)]"
          onClick={() => setMode("list")}
        >
          <ChevronLeft className="size-4" /> {t("mail.settings.templates.back")}
        </button>
        <h2 className="mb-5 text-lg font-semibold text-[var(--mail-ink)]">
          {editingId ? t("mail.settings.templates.edit_title") : t("mail.settings.templates.new_title")}
        </h2>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <FieldLabel>{t("mail.settings.templates.name")}</FieldLabel>
              <TextField
                value={draft.name}
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="flex-1">
              <FieldLabel>{t("mail.settings.templates.category")}</FieldLabel>
              <TextField
                value={draft.category}
                placeholder={t("mail.settings.templates.category_placeholder")}
                onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
              />
            </div>
          </div>
          <div>
            <FieldLabel>{t("mail.settings.templates.subject")}</FieldLabel>
            <TextField
              value={draft.subject}
              onChange={(event) => setDraft((prev) => ({ ...prev, subject: event.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>{t("mail.settings.templates.body")}</FieldLabel>
            <TextArea
              rows={8}
              value={draft.body_text}
              onChange={(event) => setDraft((prev) => ({ ...prev, body_text: event.target.value }))}
            />
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <PrimaryButton onClick={save} disabled={saving || !draft.name.trim()}>
            {t("mail.settings.templates.save")}
          </PrimaryButton>
          <SecondaryButton onClick={() => setMode("list")}>{t("mail.settings.cancel")}</SecondaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <SettingsHeader
        title={t("mail.settings.tabs.templates")}
        description={t("mail.settings.templates.subtitle")}
        action={
          <PrimaryButton onClick={startCreate}>
            <Plus className="size-4" /> {t("mail.settings.templates.new")}
          </PrimaryButton>
        }
      />
      {mail.templates.length ? (
        <div className="space-y-2.5">
          {mail.templates.map((template) => (
            <Card key={template.id} className="flex items-center gap-3.5 p-4">
              <div className="grid size-10 flex-shrink-0 place-items-center rounded-lg bg-[var(--mail-hover)] text-[var(--mail-muted)]">
                <FileText className="size-5" />
              </div>
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => startEdit(template)}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--mail-ink)]">{template.name}</span>
                  {template.category && (
                    <span className="rounded bg-[var(--mail-hover)] px-2 py-0.5 text-xs text-[var(--mail-muted)]">
                      {template.category}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 line-clamp-1 text-sm text-[var(--mail-muted)]">{template.subject}</div>
              </button>
              <button
                type="button"
                className="grid size-8 place-items-center rounded-md text-[var(--mail-muted)] hover:bg-[var(--mail-hover)] hover:text-[var(--mail-accent)]"
                onClick={() => remove(template.id)}
                title={t("mail.settings.delete")}
              >
                <Trash2 className="size-4" />
              </button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState>{t("mail.settings.templates.empty")}</EmptyState>
      )}
    </div>
  );
});
