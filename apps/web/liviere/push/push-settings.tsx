/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: "Push notifications" section of Profile settings → Notifications
// (hook in components/settings/profile/content/pages/notifications/root.tsx). Turning them on asks for the
// browser permission only after a click. Projects are chosen per account; each browser is turned on separately.

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@makeplane/propel/components/button";
import { Switch } from "@makeplane/propel/components/switch";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import { SettingsControlItem } from "@/components/settings/control-item";
import { ProfileSettingsHeading } from "@/components/settings/profile/heading";
import { pushService } from "./push.service";
import { currentSubscription, isPushSupported, subscribeBrowser } from "./register";

type TBrowserState = "loading" | "unsupported" | "denied" | "off" | "on";

const PUSH_SETTINGS_KEY = "LIVIERE_PUSH_SETTINGS";

export function LivierePushSettings() {
  const { t } = useTranslation();
  const { data: settings, mutate } = useSWR(PUSH_SETTINGS_KEY, () => pushService.settings(), {
    revalidateOnFocus: false,
  });
  const [browser, setBrowser] = useState<TBrowserState>("loading");
  const [isBusy, setIsBusy] = useState(false);

  const fail = useCallback(
    (key: string) => setToast({ type: "error", title: t("error"), message: t(`liviere.push.errors.${key}`) }),
    [t]
  );

  // State of this browser; a subscription the server lost (expired, other account) is registered again
  useEffect(() => {
    if (!settings?.available) return;
    if (!isPushSupported()) return setBrowser("unsupported");
    if (Notification.permission === "denied") return setBrowser("denied");
    let cancelled = false;
    void currentSubscription()
      .then(async (subscription) => {
        if (subscription) await pushService.subscribe(subscription.toJSON()).catch(() => undefined);
        if (!cancelled) setBrowser(subscription ? "on" : "off");
        return undefined;
      })
      .catch(() => {
        if (!cancelled) setBrowser("off");
      });
    return () => {
      cancelled = true;
    };
  }, [settings?.available]);

  const enable = async () => {
    if (!settings?.public_key) return;
    setIsBusy(true);
    try {
      const subscription = await subscribeBrowser(settings.public_key);
      if (!subscription) {
        setBrowser(Notification.permission === "denied" ? "denied" : "off");
        return;
      }
      await pushService.subscribe(subscription.toJSON());
      setBrowser("on");
    } catch {
      fail("enable");
    } finally {
      setIsBusy(false);
    }
  };

  const disable = async () => {
    setIsBusy(true);
    try {
      const subscription = await currentSubscription();
      if (subscription) {
        await pushService.unsubscribe(subscription.endpoint).catch(() => undefined);
        await subscription.unsubscribe();
      }
      setBrowser("off");
    } catch {
      fail("disable");
    } finally {
      setIsBusy(false);
    }
  };

  const toggleProject = async (projectId: string, selected: boolean) => {
    if (!settings) return;
    const ids = settings.workspaces
      .flatMap((workspace) => workspace.projects)
      .filter((project) => (project.id === projectId ? selected : project.selected))
      .map((project) => project.id);
    try {
      await pushService.setProjects(ids);
      await mutate();
    } catch {
      fail("projects");
    }
  };

  const sendTest = async () => {
    try {
      await pushService.sendTest();
      setToast({ type: "success", title: t("liviere.push.test_sent") });
    } catch {
      fail("test");
    }
  };

  if (!settings) return null;

  return (
    <div className="mt-10">
      <ProfileSettingsHeading title={t("liviere.push.heading")} description={t("liviere.push.description")} />
      <div className="mt-7 flex flex-col gap-y-1">
        {!settings.available ? (
          <p className="text-body-xs-regular text-tertiary">{t("liviere.push.unavailable")}</p>
        ) : (
          <>
            <SettingsControlItem
              title={t("liviere.push.browser.title")}
              description={t(`liviere.push.browser.${browser}`)}
              control={
                browser === "on" ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="md"
                      stretch="auto"
                      label={t("liviere.push.send_test")}
                      onClick={() => void sendTest()}
                    />
                    <Button
                      variant="secondary"
                      size="md"
                      stretch="auto"
                      label={t("liviere.push.disable")}
                      onClick={() => void disable()}
                      disabled={isBusy}
                    />
                  </div>
                ) : browser === "off" ? (
                  <Button
                    variant="primary"
                    size="md"
                    stretch="auto"
                    label={t("liviere.push.enable")}
                    onClick={() => void enable()}
                    disabled={isBusy}
                  />
                ) : null
              }
            />
            {settings.workspaces.map((workspace) => (
              <div key={workspace.slug} className="mt-4 flex flex-col gap-y-1">
                <p className="text-body-xs-medium text-secondary">
                  {t("liviere.push.projects", { workspace: workspace.name })}
                </p>
                {workspace.projects.map((project) => (
                  <SettingsControlItem
                    key={project.id}
                    title={`${project.identifier} · ${project.name}`}
                    description=""
                    control={
                      <Switch
                        size="sm"
                        checked={project.selected}
                        onCheckedChange={(selected) => void toggleProject(project.id, selected)}
                        aria-label={project.name}
                      />
                    }
                  />
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
