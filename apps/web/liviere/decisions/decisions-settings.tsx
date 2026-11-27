/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: Project settings → Features → Decisions. Turns the decision register on: the item in
// the project navigation and every endpoint but settings/ (404 decisions_disabled while off). Project admins.

import { observer } from "mobx-react";
import Link from "next/link";
import { mutate } from "swr";
import { useTranslation } from "@plane/i18n";
import { Switch } from "@makeplane/propel/components/switch";
import { Loader } from "@plane/blocks/skeleton";
import { setToast } from "@plane/blocks/toast";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
import { SettingsHeading } from "@/components/settings/heading";
import { decisionsService } from "./decisions.service";
import {
  decisionSettingsKey,
  decisionsEnabledProjectsKey,
  refreshDecisions,
  useDecisionSettings,
} from "./use-decisions";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectDecisionSettings = observer(function ProjectDecisionSettings(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { t } = useTranslation();
  const { data: settings, error } = useDecisionSettings(workspaceSlug, projectId);

  const toggle = async (enabled: boolean) => {
    if (!settings) return;
    const key = decisionSettingsKey(projectId);
    // Optimistic: show the change at once, roll back if the server refuses it
    await mutate(key, { ...settings, enabled }, { revalidate: false });
    try {
      const saved = await decisionsService.updateSettings(workspaceSlug, projectId, { enabled });
      await mutate(key, saved, { revalidate: false });
      await mutate(decisionsEnabledProjectsKey(workspaceSlug));
      await refreshDecisions(projectId);
    } catch {
      await mutate(key, settings, { revalidate: false });
      setToast({ type: "error", title: t("error"), message: t("liviere.decisions.settings.save_error") });
    }
  };

  return (
    <section className="w-full">
      <SettingsHeading
        title={t("liviere.decisions.settings.title")}
        description={t("liviere.decisions.settings.description")}
      />
      {error ? (
        <p className="mt-7 text-13 text-danger-primary">{t("liviere.decisions.settings.load_error")}</p>
      ) : !settings ? (
        <Loader className="mt-7 flex flex-col gap-3">
          <Loader.Item height="56px" width="100%" />
        </Loader>
      ) : (
        <div className="mt-7 flex flex-col gap-4">
          <SettingsBoxedControlItem
            title={t("liviere.decisions.settings.toggle_title")}
            description={t("liviere.decisions.settings.toggle_description")}
            control={
              <Switch
                size="sm"
                checked={settings.enabled}
                onCheckedChange={(on) => void toggle(on)}
                aria-label={t("liviere.decisions.settings.toggle_title")}
              />
            }
          />
          {settings.enabled && (
            <Link
              href={`/${workspaceSlug}/projects/${projectId}/decisions`}
              className="w-fit text-13 text-accent-primary hover:underline"
            >
              {t("liviere.decisions.settings.open_page")}
            </Link>
          )}
        </div>
      )}
    </section>
  );
});
