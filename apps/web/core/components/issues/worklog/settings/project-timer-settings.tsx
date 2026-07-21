/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { ToggleSwitch } from "@plane/ui";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { TimerStatesField } from "./timer-states-field";

type TProjectTimerSettings = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectTimerSettings = observer(function ProjectTimerSettings(props: TProjectTimerSettings) {
  const { workspaceSlug, projectId } = props;
  const { t } = useTranslation();
  const { getProjectById, updateProject } = useProject();
  const { currentWorkspace } = useWorkspace();
  const [submitting, setSubmitting] = useState(false);

  const project = getProjectById(projectId);
  const workspaceDefault = currentWorkspace?.worklog_timer_state_groups ?? ["started"];
  const override = project?.worklog_timer_state_groups;
  const isOverriding = Array.isArray(override);
  const value = isOverriding ? (override as string[]) : workspaceDefault;

  const save = async (groups: string[] | null) => {
    setSubmitting(true);
    try {
      await updateProject(workspaceSlug, projectId, { worklog_timer_state_groups: groups });
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("common.success"), message: t("common.time_tracking") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("common.error.label") });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-t border-subtle py-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-medium text-primary">{t("common.time_tracking")}</h4>
          <p className="text-sm mt-1 text-secondary">{t("common.worklog_override_workspace")}</p>
        </div>
        <ToggleSwitch
          value={isOverriding}
          onChange={(enabled) => save(enabled ? [...value] : null)}
          disabled={submitting}
        />
      </div>
      {isOverriding && (
        <div className="mt-4">
          <p className="text-sm mb-3 text-secondary">{t("common.time_tracking_states_description")}</p>
          <TimerStatesField value={value} onChange={(groups) => save(groups)} disabled={submitting} />
        </div>
      )}
    </section>
  );
});
