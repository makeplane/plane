/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Plus, Trash2 } from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import type { TMailSignature } from "@plane/types";
import { useMail } from "@/hooks/store/use-mail";
import {
  Card,
  CardRow,
  EmptyState,
  FieldLabel,
  MailToggle,
  PrimaryButton,
  SecondaryButton,
  SettingsHeader,
  TextArea,
  TextField,
} from "./primitives";

type Draft = { name: string; content_text: string; is_default: boolean; is_active: boolean };

const DEFAULT_DRAFT: Draft = { name: "", content_text: "", is_default: false, is_active: true };

export const MailSignatureSettings = observer(function MailSignatureSettings() {
  const { t } = useTranslation();
  const mail = useMail();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT);
  const [saving, setSaving] = useState(false);

  const startCreate = () => {
    setCreating(true);
    setEditingId(null);
    setDraft(DEFAULT_DRAFT);
  };

  const startEdit = (signature: TMailSignature) => {
    setCreating(false);
    setEditingId(signature.id);
    setDraft({
      name: signature.name,
      content_text: signature.content_text,
      is_default: signature.is_default,
      is_active: signature.is_active,
    });
  };

  const cancel = () => {
    setCreating(false);
    setEditingId(null);
    setDraft(DEFAULT_DRAFT);
  };

  const save = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) await mail.updateSignature(editingId, draft);
      else await mail.createSignature(draft);
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
      await mail.deleteSignature(id);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("mail.settings.toasts.deleted") });
      if (editingId === id) cancel();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("mail.settings.toasts.error") });
    }
  };

  const isEditing = creating || editingId !== null;

  return (
    <div className="max-w-2xl">
      <SettingsHeader
        title={t("mail.settings.tabs.signature")}
        description={t("mail.settings.signature.subtitle")}
        action={
          !isEditing ? (
            <SecondaryButton onClick={startCreate}>
              <Plus className="size-4" /> {t("mail.settings.signature.new")}
            </SecondaryButton>
          ) : undefined
        }
      />

      {isEditing ? (
        <Card className="p-5">
          <div className="space-y-4">
            <div>
              <FieldLabel>{t("mail.settings.signature.name")}</FieldLabel>
              <TextField
                value={draft.name}
                placeholder={t("mail.settings.signature.name_placeholder")}
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div>
              <FieldLabel>{t("mail.settings.signature.content")}</FieldLabel>
              <TextArea
                rows={6}
                value={draft.content_text}
                placeholder={t("mail.settings.signature.content_placeholder")}
                onChange={(event) => setDraft((prev) => ({ ...prev, content_text: event.target.value }))}
              />
            </div>
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--mail-ink)]">{t("mail.settings.signature.default")}</span>
              <MailToggle
                value={draft.is_default}
                onChange={(value) => setDraft((prev) => ({ ...prev, is_default: value }))}
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--mail-ink)]">{t("mail.settings.signature.active")}</span>
              <MailToggle
                value={draft.is_active}
                onChange={(value) => setDraft((prev) => ({ ...prev, is_active: value }))}
              />
            </label>
          </div>
          <div className="mt-5 flex gap-3">
            <PrimaryButton onClick={save} disabled={saving || !draft.name.trim()}>
              {t("mail.settings.save")}
            </PrimaryButton>
            <SecondaryButton onClick={cancel}>{t("mail.settings.cancel")}</SecondaryButton>
          </div>
        </Card>
      ) : mail.signatures.length ? (
        <Card>
          {mail.signatures.map((signature, index) => (
            <CardRow key={signature.id} last={index === mail.signatures.length - 1}>
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => startEdit(signature)}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--mail-ink)]">{signature.name}</span>
                  {signature.is_default && (
                    <span className="rounded bg-[var(--mail-accent)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {t("mail.settings.signature.default_badge")}
                    </span>
                  )}
                  {!signature.is_active && (
                    <span className="text-xs text-[var(--mail-muted)]">{t("mail.settings.signature.inactive")}</span>
                  )}
                </div>
                <div className="mt-1 line-clamp-1 text-sm text-[var(--mail-muted)]">{signature.content_text}</div>
              </button>
              <button
                type="button"
                className={cn("grid size-8 place-items-center rounded-md text-[var(--mail-muted)] hover:bg-[var(--mail-hover)] hover:text-[var(--mail-accent)]")}
                onClick={() => remove(signature.id)}
                title={t("mail.settings.delete")}
              >
                <Trash2 className="size-4" />
              </button>
            </CardRow>
          ))}
        </Card>
      ) : (
        <EmptyState>{t("mail.settings.signature.empty")}</EmptyState>
      )}
    </div>
  );
});
