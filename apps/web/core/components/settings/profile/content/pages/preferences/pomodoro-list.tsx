/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Input, ToggleSwitch } from "@plane/ui";
import type { TPomodoroSettings } from "@plane/types";
import { DEFAULT_POMODORO_SETTINGS } from "@plane/types";
// components
import { SettingsControlItem } from "@/components/settings/control-item";
// helpers
import {
  requestBrowserNotificationPermission,
  showBrowserPomodoroNotification,
} from "@/components/pomodoro/notifications";
// hooks
import { useUserProfile } from "@/hooks/store/user";
import { usePomodoroTimer } from "@/hooks/pomodoro/use-pomodoro-timer";
import { PomodoroTimerService } from "@/services/pomodoro/pomodoro-timer.service";

export const ProfileSettingsPomodoroPreferences = observer(function ProfileSettingsPomodoroPreferences() {
  const { t } = useTranslation();
  const { settings } = usePomodoroTimer();
  const { updateUserProfile } = useUserProfile();
  const [discordUrl, setDiscordUrl] = useState(settings.discord_webhook_url || "");
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingBrowser, setIsTestingBrowser] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const merged: TPomodoroSettings = { ...DEFAULT_POMODORO_SETTINGS, ...settings };

  useEffect(() => {
    setDiscordUrl(merged.discord_webhook_url || "");
  }, [merged.discord_webhook_url]);

  const updateSetting = async <K extends keyof TPomodoroSettings>(key: K, value: TPomodoroSettings[K]) => {
    await updateUserProfile({ pomodoro_settings: { ...merged, [key]: value } });
  };

  const handleBrowserNotifications = async (enabled: boolean) => {
    if (enabled) {
      const permission = await requestBrowserNotificationPermission();
      if (permission !== "granted") {
        await updateSetting("browser_notifications", false);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("pomodoro.browser_notifications"),
          message:
            permission === "unsupported"
              ? t("pomodoro.browser_notifications_unsupported")
              : t("pomodoro.browser_notifications_denied"),
        });
        return;
      }
      await updateSetting("browser_notifications", true);
      const shown = await showBrowserPomodoroNotification(
        t("pomodoro.browser_notifications_enabled_title"),
        t("pomodoro.browser_notifications_enabled_body")
      );
      if (!shown) {
        setToast({
          type: TOAST_TYPE.INFO,
          title: t("pomodoro.browser_notifications_enabled_title"),
          message: t("pomodoro.browser_notifications_enabled_body"),
        });
      }
      return;
    }
    await updateSetting("browser_notifications", false);
  };

  const sendTestBrowser = async () => {
    setIsTestingBrowser(true);
    try {
      const permission = await requestBrowserNotificationPermission();
      if (permission !== "granted") {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("pomodoro.browser_notifications"),
          message:
            permission === "unsupported"
              ? t("pomodoro.browser_notifications_unsupported")
              : t("pomodoro.browser_notifications_denied"),
        });
        return;
      }
      const shown = await showBrowserPomodoroNotification(
        t("pomodoro.notify_test_title"),
        t("pomodoro.browser_notify_test_body")
      );
      if (shown) {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("pomodoro.notify_test_title"),
          message: t("pomodoro.browser_notify_test_success"),
        });
      } else {
        setToast({
          type: TOAST_TYPE.INFO,
          title: t("pomodoro.notify_test_title"),
          message: t("pomodoro.browser_notify_test_body"),
        });
      }
    } finally {
      setIsTestingBrowser(false);
    }
  };

  const saveDiscordUrl = async () => {
    await updateSetting("discord_webhook_url", discordUrl.trim());
    setTestMessage(null);
  };

  const sendTestDiscord = async () => {
    setIsTesting(true);
    setTestMessage(null);
    const url = discordUrl.trim();
    if (!url) {
      setTestMessage(t("pomodoro.notify_test_error"));
      setIsTesting(false);
      return;
    }
    try {
      await saveDiscordUrl();
      const service = new PomodoroTimerService();
      await service.notifyPhaseEnd({
        phase: "focus",
        title: t("pomodoro.notify_test_title"),
        body: t("pomodoro.notify_test_body"),
        webhook_url: url,
      });
      setTestMessage(t("pomodoro.notify_test_success"));
    } catch {
      setTestMessage(t("pomodoro.notify_test_error"));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-y-1 divide-y divide-subtle">
      <SettingsControlItem
        title={t("pomodoro.focus_minutes")}
        description={t("pomodoro.focus_minutes_description")}
        control={
          <NumberInput
            value={merged.focus_minutes}
            min={1}
            max={120}
            onChange={(v) => void updateSetting("focus_minutes", v)}
          />
        }
      />
      <SettingsControlItem
        title={t("pomodoro.short_break_minutes")}
        description={t("pomodoro.short_break_minutes_description")}
        control={
          <NumberInput
            value={merged.short_break_minutes}
            min={1}
            max={60}
            onChange={(v) => void updateSetting("short_break_minutes", v)}
          />
        }
      />
      <SettingsControlItem
        title={t("pomodoro.long_break_minutes")}
        description={t("pomodoro.long_break_minutes_description")}
        control={
          <NumberInput
            value={merged.long_break_minutes}
            min={1}
            max={60}
            onChange={(v) => void updateSetting("long_break_minutes", v)}
          />
        }
      />
      <SettingsControlItem
        title={t("pomodoro.sessions_before_long_break")}
        description={t("pomodoro.sessions_before_long_break_description")}
        control={
          <NumberInput
            value={merged.sessions_before_long_break}
            min={1}
            max={12}
            onChange={(v) => void updateSetting("sessions_before_long_break", v)}
          />
        }
      />
      <SettingsControlItem
        title={t("pomodoro.auto_start_break")}
        description={t("pomodoro.auto_start_break_description")}
        control={
          <ToggleSwitch
            value={merged.auto_start_break}
            onChange={(value) => void updateSetting("auto_start_break", value)}
            size="sm"
          />
        }
      />
      <SettingsControlItem
        title={t("pomodoro.auto_start_focus")}
        description={t("pomodoro.auto_start_focus_description")}
        control={
          <ToggleSwitch
            value={merged.auto_start_focus}
            onChange={(value) => void updateSetting("auto_start_focus", value)}
            size="sm"
          />
        }
      />
      <SettingsControlItem
        title={t("pomodoro.auto_create_time_log")}
        description={t("pomodoro.auto_create_time_log_description")}
        control={
          <ToggleSwitch
            value={merged.auto_create_time_log}
            onChange={(value) => void updateSetting("auto_create_time_log", value)}
            size="sm"
          />
        }
      />
      <SettingsControlItem
        title={t("pomodoro.browser_notifications")}
        description={t("pomodoro.browser_notifications_description")}
        control={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => void sendTestBrowser()} loading={isTestingBrowser}>
              {t("pomodoro.notify_test")}
            </Button>
            <ToggleSwitch
              value={merged.browser_notifications}
              onChange={(value) => void handleBrowserNotifications(value)}
              size="sm"
            />
          </div>
        }
      />
      <div className="flex w-full flex-col gap-3 py-3">
        <div className="flex flex-col gap-1">
          <h4 className="text-body-sm-medium text-primary">{t("pomodoro.discord_webhook")}</h4>
          <p className="text-caption-md-regular text-secondary">{t("pomodoro.discord_webhook_description")}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            id="discord-webhook-url"
            type="url"
            value={discordUrl}
            onChange={(e) => setDiscordUrl(e.target.value)}
            onBlur={() => void saveDiscordUrl()}
            placeholder="https://discord.com/api/webhooks/…"
            className="w-full"
          />
          <Button variant="secondary" size="sm" onClick={() => void sendTestDiscord()} loading={isTesting}>
            {t("pomodoro.notify_test")}
          </Button>
        </div>
        {testMessage && <p className="text-caption-md-regular text-secondary">{testMessage}</p>}
      </div>
    </div>
  );
});

const NumberInput = ({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) => (
  <input
    type="number"
    min={min}
    max={max}
    value={value}
    onChange={(e) => {
      const v = parseInt(e.target.value, 10);
      if (!Number.isNaN(v) && v >= min && v <= max) onChange(v);
    }}
    className="focus:border-accent-primary w-20 rounded border border-subtle bg-transparent px-2 py-1.5 text-right text-body-sm-regular text-primary outline-none"
  />
);
