/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { useMail } from "@/hooks/store/use-mail";
import { Card, CardRow, SettingsHeader } from "./primitives";

function SegmentedControl(props: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { options, value, onChange } = props;
  return (
    <div className="flex flex-shrink-0 gap-1 rounded-lg bg-[var(--mail-hover)] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
            value === option.value ? "bg-white text-[var(--mail-ink)] shadow-sm" : "text-[var(--mail-muted)]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <CardRow>
      <div className="flex-1 text-sm font-semibold text-[var(--mail-ink)]">{title}</div>
      {children}
    </CardRow>
  );
}

export const MailAppearanceSettings = observer(function MailAppearanceSettings() {
  const { t } = useTranslation();
  const mail = useMail();
  const prefs = mail.preferences;

  const patch = async (data: Record<string, unknown>) => {
    try {
      await mail.patchPreferences(data);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("mail.settings.toasts.error") });
    }
  };

  return (
    <div className="max-w-2xl">
      <SettingsHeader title={t("mail.settings.tabs.appearance")} description={t("mail.settings.appearance.subtitle")} />
      <Card>
        <Row title={t("mail.settings.appearance.theme")}>
          <SegmentedControl
            value={prefs?.theme ?? "system"}
            onChange={(value) => patch({ theme: value })}
            options={[
              { value: "light", label: t("mail.settings.appearance.theme_light") },
              { value: "dark", label: t("mail.settings.appearance.theme_dark") },
              { value: "system", label: t("mail.settings.appearance.theme_system") },
            ]}
          />
        </Row>
        <Row title={t("mail.settings.appearance.density")}>
          <SegmentedControl
            value={prefs?.density ?? "comfortable"}
            onChange={(value) => patch({ density: value })}
            options={[
              { value: "comfortable", label: t("mail.settings.appearance.comfortable") },
              { value: "compact", label: t("mail.settings.appearance.compact") },
            ]}
          />
        </Row>
        <CardRow last>
          <div className="flex-1 text-sm font-semibold text-[var(--mail-ink)]">
            {t("mail.settings.appearance.reading_pane")}
          </div>
          <SegmentedControl
            value={prefs?.reading_pane ?? "right"}
            onChange={(value) => patch({ reading_pane: value })}
            options={[
              { value: "right", label: t("mail.settings.appearance.pane_right") },
              { value: "bottom", label: t("mail.settings.appearance.pane_bottom") },
              { value: "none", label: t("mail.settings.appearance.pane_none") },
            ]}
          />
        </CardRow>
      </Card>
    </div>
  );
});
