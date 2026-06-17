/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { EUserPermissions } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { TimerStatesField } from "./timer-states-field";

export const WorkspaceTimerSettings = observer(function WorkspaceTimerSettings() {
  const { t } = useTranslation();
  const { currentWorkspace, updateWorkspace } = useWorkspace();
  const [submitting, setSubmitting] = useState(false);

  if (!currentWorkspace) return null;

  const isAdmin = currentWorkspace.role === EUserPermissions.ADMIN;
  const value = currentWorkspace.worklog_timer_state_groups ?? ["started"];

  const handleChange = async (groups: string[]) => {
    setSubmitting(true);
    try {
      await updateWorkspace(currentWorkspace.slug, { worklog_timer_state_groups: groups });
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("common.success"), message: t("common.time_tracking") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("common.error") });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-t border-subtle py-6">
      <h4 className="text-lg font-medium text-primary">{t("common.time_tracking")}</h4>
      <p className="text-sm mt-1 mb-4 text-secondary">{t("common.time_tracking_states_description")}</p>
      <TimerStatesField value={value} onChange={handleChange} disabled={!isAdmin || submitting} />
    </section>
  );
});
