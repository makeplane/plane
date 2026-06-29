/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import type { TMailPreference } from "@plane/types";
import { useMail } from "@/hooks/store/use-mail";
import { useUserProfile } from "@/hooks/store/user";
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
            "text-sm rounded-md px-3 py-1.5 font-semibold transition-colors",
            value === option.value ? "shadow-sm bg-white text-[var(--mail-ink)]" : "text-[var(--mail-muted)]"
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
      <div className="text-sm flex-1 font-semibold text-[var(--mail-ink)]">{title}</div>
      {children}
    </CardRow>
  );
}

export const MailAppearanceSettings = observer(function MailAppearanceSettings() {
  const { t } = useTranslation();
  const mail = useMail();
  const { updateUserTheme } = useUserProfile();
  const { setTheme } = useTheme();
  const prefs = mail.preferences;

  const patch = async (data: Partial<TMailPreference>) => {
    try {
      await mail.patchPreferences(data);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("mail.settings.toasts.error") });
    }
  };

  const patchTheme = async (theme: string) => {
    try {
      setTheme(theme);
      await Promise.all([mail.patchPreferences({ theme }), updateUserTheme({ theme })]);
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
            value={prefs.theme}
            onChange={(value) => void patchTheme(value)}
            options={[
              { value: "system", label: t("mail.settings.appearance.theme_system") },
              { value: "light", label: t("mail.settings.appearance.theme_light") },
              { value: "dark", label: t("mail.settings.appearance.theme_dark") },
            ]}
          />
        </Row>
        <Row title={t("mail.settings.appearance.density")}>
          <SegmentedControl
            value={prefs.density}
            onChange={(value) => void patch({ density: value })}
            options={[
              { value: "comfortable", label: t("mail.settings.appearance.comfortable") },
              { value: "compact", label: t("mail.settings.appearance.compact") },
            ]}
          />
        </Row>
        <CardRow>
          <div className="text-sm flex-1 font-semibold text-[var(--mail-ink)]">
            {t("mail.settings.appearance.reading_pane")}
          </div>
          <SegmentedControl
            value={prefs.reading_pane}
            onChange={(value) => void patch({ reading_pane: value })}
            options={[
              { value: "right", label: t("mail.settings.appearance.pane_right") },
              { value: "bottom", label: t("mail.settings.appearance.pane_bottom") },
              { value: "none", label: t("mail.settings.appearance.pane_none") },
            ]}
          />
        </CardRow>
        <Row title={t("mail.settings.appearance.messages_per_page")}>
          <SegmentedControl
            value={String(prefs.messages_per_page)}
            onChange={(value) => void patch({ messages_per_page: Number(value) })}
            options={[
              { value: "10", label: "10" },
              { value: "25", label: "25" },
              { value: "50", label: "50" },
              { value: "100", label: "100" },
            ]}
          />
        </Row>
        <CardRow last>
          <div className="text-sm flex-1 font-semibold text-[var(--mail-ink)]">
            {t("mail.settings.appearance.mark_read_delay")}
          </div>
          <SegmentedControl
            value={String(prefs.mark_read_delay_ms)}
            onChange={(value) => void patch({ mark_read_delay_ms: Number(value) })}
            options={[
              { value: "0", label: t("mail.settings.appearance.delay_none") },
              { value: "1000", label: t("mail.settings.appearance.delay_1s") },
              { value: "1500", label: t("mail.settings.appearance.delay_1_5s") },
              { value: "3000", label: t("mail.settings.appearance.delay_3s") },
            ]}
          />
        </CardRow>
      </Card>
    </div>
  );
});
