/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: Project settings → Features → Activity. Turns the feature on and picks the actions
// the heatmap counts; the choice applies to past events too. Project admins only.

import { observer } from "mobx-react";
import { mutate } from "swr";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Loader, ToggleSwitch } from "@plane/ui";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
import { SettingsControlItem } from "@/components/settings/control-item";
import { SettingsHeading } from "@/components/settings/heading";
import { projectActivityService } from "./activity.service";
import { activitySettingsKey, enabledProjectsKey, useActivitySettings } from "./use-activity";
import type { TActivitySettings } from "./types";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectActivitySettings = observer(function ProjectActivitySettings(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { t } = useTranslation();
  const { data: settings } = useActivitySettings(workspaceSlug, projectId);

  const save = async (change: Partial<Pick<TActivitySettings, "enabled" | "kinds">>) => {
    if (!settings) return;
    const key = activitySettingsKey(projectId);
    // Optimistic: show the change at once, roll back if the server refuses it
    await mutate(key, { ...settings, ...change }, { revalidate: false });
    try {
      const saved = await projectActivityService.updateSettings(workspaceSlug, projectId, change);
      await mutate(key, saved, { revalidate: false });
      if ("enabled" in change) await mutate(enabledProjectsKey(workspaceSlug));
    } catch {
      await mutate(key, settings, { revalidate: false });
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t("liviere.activity.settings.save_error") });
    }
  };

  const toggleKind = (kind: string, on: boolean) => {
    if (!settings) return;
    const kinds = on ? [...settings.kinds, kind] : settings.kinds.filter((key) => key !== kind);
    void save({ kinds });
  };

  return (
    <section className="w-full">
      <SettingsHeading
        title={t("liviere.activity.settings.title")}
        description={t("liviere.activity.settings.description")}
      />
      {!settings ? (
        <Loader className="mt-7 flex flex-col gap-3">
          <Loader.Item height="56px" width="100%" />
          <Loader.Item height="240px" width="100%" />
        </Loader>
      ) : (
        <div className="mt-7 flex flex-col gap-8">
          <SettingsBoxedControlItem
            title={t("liviere.activity.settings.toggle_title")}
            description={t("liviere.activity.settings.toggle_description")}
            control={
              <ToggleSwitch
                value={settings.enabled}
                onChange={() => void save({ enabled: !settings.enabled })}
                size="sm"
              />
            }
          />
          <div className="flex flex-col gap-2">
            <h3 className="text-body-sm-medium text-primary">{t("liviere.activity.settings.kinds_title")}</h3>
            <p className="text-caption-md-regular text-tertiary">{t("liviere.activity.settings.kinds_description")}</p>
            {settings.catalog.map((group) => (
              <div key={group.group} className="mt-4">
                <h4 className="text-caption-md-medium tracking-wide text-tertiary uppercase">
                  {t(`liviere.activity.groups.${group.group}`)}
                </h4>
                <div className="divide-y divide-subtle">
                  {group.kinds.map(({ key }) => (
                    <SettingsControlItem
                      key={key}
                      title={t(`liviere.activity.kinds.${key}`)}
                      description={t(`liviere.activity.kind_descriptions.${key}`)}
                      control={
                        <ToggleSwitch
                          value={settings.kinds.includes(key)}
                          onChange={(on) => toggleKind(key, on)}
                          size="sm"
                        />
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
});
