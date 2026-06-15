/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import type { TMailLabel } from "@plane/types";
import { useMail } from "@/hooks/store/use-mail";
import {
  Card,
  CardRow,
  FieldLabel,
  MAIL_LABEL_COLORS,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  SettingsHeader,
  TextField,
} from "./primitives";

export const MailFoldersSettings = observer(function MailFoldersSettings() {
  const { t } = useTranslation();
  const mail = useMail();
  const [editing, setEditing] = useState<{ id: string | null; name: string; color: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const systemFolders = mail.folders.filter((folder) => !folder.virtual);

  const startCreate = () => setEditing({ id: null, name: "", color: MAIL_LABEL_COLORS[0] });
  const startEdit = (label: TMailLabel) => setEditing({ id: label.id, name: label.name, color: label.color });
  const cancel = () => setEditing(null);

  const save = async () => {
    if (!editing || !editing.name.trim()) return;
    setSaving(true);
    try {
      if (editing.id) await mail.updateLabel(editing.id, { name: editing.name, color: editing.color });
      else await mail.createLabel({ name: editing.name, color: editing.color });
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
      await mail.deleteLabel(id);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("mail.settings.toasts.deleted") });
      if (editing?.id === id) cancel();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("mail.settings.toasts.error") });
    }
  };

  return (
    <div className="max-w-2xl">
      <SettingsHeader title={t("mail.settings.tabs.folders")} description={t("mail.settings.folders.subtitle")} />

      <SectionTitle>{t("mail.settings.folders.system_title")}</SectionTitle>
      <Card>
        {systemFolders.map((folder, index) => (
          <CardRow key={folder.key} last={index === systemFolders.length - 1}>
            <span className="flex-1 text-sm text-[var(--mail-ink)]">{folder.label}</span>
            {!!folder.total && (
              <span className="text-xs text-[var(--mail-muted)]">{folder.total}</span>
            )}
            <span className="text-[var(--mail-border)]">
              <Lock className="size-4" />
            </span>
          </CardRow>
        ))}
      </Card>

      <div className="mt-7 flex items-center">
        <div className="flex-1 text-base font-semibold text-[var(--mail-ink)]">
          {t("mail.settings.folders.labels_title")}
        </div>
        {!editing && (
          <SecondaryButton onClick={startCreate}>
            <Plus className="size-4" /> {t("mail.settings.folders.new_label")}
          </SecondaryButton>
        )}
      </div>

      {editing && (
        <Card className="mt-3 p-5">
          <FieldLabel>{t("mail.settings.folders.label_name")}</FieldLabel>
          <TextField
            value={editing.name}
            autoFocus
            placeholder={t("mail.settings.folders.label_name")}
            onChange={(event) => setEditing((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
          />
          <FieldLabel>
            <span className="mt-4 block">{t("mail.settings.folders.color")}</span>
          </FieldLabel>
          <div className="flex flex-wrap gap-2">
            {MAIL_LABEL_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setEditing((prev) => (prev ? { ...prev, color } : prev))}
                className={cn(
                  "size-7 rounded-md border-2 transition",
                  editing.color === color ? "border-[var(--mail-ink)]" : "border-transparent"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="mt-5 flex gap-3">
            <PrimaryButton onClick={save} disabled={saving || !editing.name.trim()}>
              {t("mail.settings.save")}
            </PrimaryButton>
            <SecondaryButton onClick={cancel}>{t("mail.settings.cancel")}</SecondaryButton>
          </div>
        </Card>
      )}

      <Card className="mt-3">
        {mail.labels.length ? (
          mail.labels.map((label, index) => (
            <CardRow key={label.id} last={index === mail.labels.length - 1}>
              <span className="size-3 flex-shrink-0 rounded" style={{ backgroundColor: label.color }} />
              <span className="flex-1 text-sm text-[var(--mail-ink)]">{label.name}</span>
              <button
                type="button"
                className="grid size-8 place-items-center rounded-md text-[var(--mail-muted)] hover:bg-[var(--mail-hover)] hover:text-[var(--mail-ink)]"
                onClick={() => startEdit(label)}
                title={t("mail.settings.edit")}
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                className="grid size-8 place-items-center rounded-md text-[var(--mail-muted)] hover:bg-[var(--mail-hover)] hover:text-[var(--mail-accent)]"
                onClick={() => remove(label.id)}
                title={t("mail.settings.delete")}
              >
                <Trash2 className="size-4" />
              </button>
            </CardRow>
          ))
        ) : (
          <div className="px-5 py-6 text-center text-sm text-[var(--mail-muted)]">
            {t("mail.settings.folders.labels_empty")}
          </div>
        )}
      </Card>
    </div>
  );
});
