/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import type { TMailForwarding } from "@plane/types";
import { useMail } from "@/hooks/store/use-mail";
import {
  Card,
  CardRow,
  FieldLabel,
  MailToggle,
  PrimaryButton,
  SectionTitle,
  SettingsHeader,
  TextArea,
  TextField,
} from "./primitives";

type Draft = {
  forward_enabled: boolean;
  forward_to: string;
  keep_copy: boolean;
  vacation_enabled: boolean;
  vacation_subject: string;
  vacation_message: string;
  vacation_start: string;
  vacation_end: string;
};

const toDraft = (forwarding: TMailForwarding | null): Draft => ({
  forward_enabled: !!forwarding?.forward_enabled,
  forward_to: (forwarding?.forward_to ?? []).join(", "),
  keep_copy: forwarding?.keep_copy ?? true,
  vacation_enabled: !!forwarding?.vacation_enabled,
  vacation_subject: forwarding?.vacation_subject ?? "",
  vacation_message: forwarding?.vacation_message ?? "",
  vacation_start: forwarding?.vacation_start ? forwarding.vacation_start.slice(0, 10) : "",
  vacation_end: forwarding?.vacation_end ? forwarding.vacation_end.slice(0, 10) : "",
});

export const MailForwardingSettings = observer(function MailForwardingSettings() {
  const { t } = useTranslation();
  const mail = useMail();
  const [draft, setDraft] = useState<Draft>(() => toDraft(mail.forwarding));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(toDraft(mail.forwarding));
  }, [mail.forwarding]);

  const set = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      await mail.updateForwarding({
        forward_enabled: draft.forward_enabled,
        forward_to: draft.forward_to
          .split(/[,\s]+/)
          .map((value) => value.trim())
          .filter(Boolean),
        keep_copy: draft.keep_copy,
        vacation_enabled: draft.vacation_enabled,
        vacation_subject: draft.vacation_subject,
        vacation_message: draft.vacation_message,
        vacation_start: draft.vacation_start || null,
        vacation_end: draft.vacation_end || null,
      });
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("mail.settings.toasts.saved") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("mail.settings.toasts.error") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <SettingsHeader title={t("mail.settings.tabs.forwarding")} description={t("mail.settings.forwarding.subtitle")} />

      <Card>
        <CardRow last={!draft.forward_enabled}>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[var(--mail-ink)]">{t("mail.settings.forwarding.enabled")}</div>
            <div className="mt-0.5 text-sm text-[var(--mail-muted)]">{t("mail.settings.forwarding.enabled_desc")}</div>
          </div>
          <MailToggle value={draft.forward_enabled} onChange={(value) => set({ forward_enabled: value })} />
        </CardRow>
        {draft.forward_enabled && (
          <>
            <div className="border-b border-[var(--mail-border)] px-5 py-4">
              <FieldLabel>{t("mail.settings.forwarding.address")}</FieldLabel>
              <TextField
                value={draft.forward_to}
                placeholder={t("mail.settings.forwarding.address_placeholder")}
                onChange={(event) => set({ forward_to: event.target.value })}
              />
            </div>
            <CardRow last>
              <div className="flex-1 text-sm font-semibold text-[var(--mail-ink)]">
                {t("mail.settings.forwarding.keep_copy")}
              </div>
              <MailToggle value={draft.keep_copy} onChange={(value) => set({ keep_copy: value })} />
            </CardRow>
          </>
        )}
      </Card>

      <SectionTitle>{t("mail.settings.forwarding.vacation_title")}</SectionTitle>
      <Card>
        <CardRow last={!draft.vacation_enabled}>
          <div className="flex-1 text-sm font-semibold text-[var(--mail-ink)]">
            {t("mail.settings.forwarding.vacation_enabled")}
          </div>
          <MailToggle value={draft.vacation_enabled} onChange={(value) => set({ vacation_enabled: value })} />
        </CardRow>
        {draft.vacation_enabled && (
          <>
            <div className="flex gap-3 border-b border-[var(--mail-border)] px-5 py-4">
              <div className="flex-1">
                <FieldLabel>{t("mail.settings.forwarding.start")}</FieldLabel>
                <TextField
                  type="date"
                  value={draft.vacation_start}
                  onChange={(event) => set({ vacation_start: event.target.value })}
                />
              </div>
              <div className="flex-1">
                <FieldLabel>{t("mail.settings.forwarding.end")}</FieldLabel>
                <TextField
                  type="date"
                  value={draft.vacation_end}
                  onChange={(event) => set({ vacation_end: event.target.value })}
                />
              </div>
            </div>
            <div className="border-b border-[var(--mail-border)] px-5 py-4">
              <FieldLabel>{t("mail.settings.forwarding.vacation_subject")}</FieldLabel>
              <TextField
                value={draft.vacation_subject}
                onChange={(event) => set({ vacation_subject: event.target.value })}
              />
            </div>
            <div className="px-5 py-4">
              <FieldLabel>{t("mail.settings.forwarding.vacation_message")}</FieldLabel>
              <TextArea
                rows={4}
                value={draft.vacation_message}
                onChange={(event) => set({ vacation_message: event.target.value })}
              />
            </div>
          </>
        )}
      </Card>

      <div className="mt-5">
        <PrimaryButton onClick={save} disabled={saving}>
          {t("mail.settings.save")}
        </PrimaryButton>
      </div>
    </div>
  );
});
