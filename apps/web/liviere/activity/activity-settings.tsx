/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: Project settings → Features → Activity. Turns the feature on and picks the actions
// the heatmap counts; the choice applies to past events too. Also the thresholds of the series of actions
// the time report counts. Project admins only.

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { mutate } from "swr";
import { useTranslation } from "@plane/i18n";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { Switch } from "@makeplane/propel/components/switch";
import { Loader } from "@plane/blocks/skeleton";
import { setToast } from "@plane/blocks/toast";
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

type TSettingsChange = Partial<
  Pick<TActivitySettings, "enabled" | "kinds" | "series_gap_minutes" | "series_padding_minutes">
>;

// The API accepts (apps/api/plane/liviere/activity/report.py); the padding also must not exceed the gap
const SERIES_LIMITS = { series_gap_minutes: [1, 120], series_padding_minutes: [0, 60] } as const;
type TSeriesField = keyof typeof SERIES_LIMITS;

/** Whole minutes; saved when the field loses focus with a valid value. */
function MinutesInput(props: {
  value: number;
  field: TSeriesField;
  label: string;
  isValid: (value: number) => boolean;
  onSave: (value: number) => void;
}) {
  const { value, field, label, isValid, onSave } = props;
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const [min, max] = SERIES_LIMITS[field];
  const parsed = Number(text);
  const valid = /^\d+$/.test(text) && parsed >= min && parsed <= max && isValid(parsed);
  return (
    <div className="w-24">
      <InputGroup size="md">
        <Input
          size="md"
          type="number"
          min={min}
          max={max}
          step="1"
          value={text}
          aria-label={label}
          aria-invalid={valid ? undefined : true}
          data-invalid={valid ? undefined : ""}
          onChange={(event) => setText(event.target.value)}
          onBlur={() => {
            if (!valid) setText(String(value));
            else if (parsed !== value) onSave(parsed);
          }}
        />
      </InputGroup>
    </div>
  );
}

export const ProjectActivitySettings = observer(function ProjectActivitySettings(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { t } = useTranslation();
  const { data: settings } = useActivitySettings(workspaceSlug, projectId);

  const save = async (change: TSettingsChange) => {
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
      setToast({ type: "error", title: t("error"), message: t("liviere.activity.settings.save_error") });
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
              <Switch
                size="sm"
                checked={settings.enabled}
                onCheckedChange={(on) => void save({ enabled: on })}
                aria-label={t("liviere.activity.settings.toggle_title")}
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
                        <Switch
                          size="sm"
                          checked={settings.kinds.includes(key)}
                          onCheckedChange={(on) => toggleKind(key, on)}
                          aria-label={t(`liviere.activity.kinds.${key}`)}
                        />
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-body-sm-medium text-primary">{t("liviere.activity.settings.report_title")}</h3>
            <p className="text-caption-md-regular text-tertiary">{t("liviere.activity.settings.report_description")}</p>
            <div className="divide-y divide-subtle">
              <SettingsControlItem
                title={t("liviere.activity.settings.series_gap")}
                description={t("liviere.activity.settings.series_gap_description")}
                control={
                  <MinutesInput
                    field="series_gap_minutes"
                    value={settings.series_gap_minutes}
                    label={t("liviere.activity.settings.series_gap")}
                    isValid={(gap) => gap >= settings.series_padding_minutes}
                    onSave={(gap) => void save({ series_gap_minutes: gap })}
                  />
                }
              />
              <SettingsControlItem
                title={t("liviere.activity.settings.series_padding")}
                description={t("liviere.activity.settings.series_padding_description")}
                control={
                  <MinutesInput
                    field="series_padding_minutes"
                    value={settings.series_padding_minutes}
                    label={t("liviere.activity.settings.series_padding")}
                    isValid={(padding) => padding <= settings.series_gap_minutes}
                    onSave={(padding) => void save({ series_padding_minutes: padding })}
                  />
                }
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
});
