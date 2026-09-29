/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { ToggleSwitch } from "@plane/ui";
// helpers
import { getWorkflowErrorMessage } from "@/utils/workflow-error";

type TWorkflowToggleProps = {
  /** `null` while the persisted value has not been read yet. */
  isEnabled: boolean | undefined;
  isLoading: boolean;
  isEditable: boolean;
  onToggle: (nextValue: boolean) => Promise<void>;
};

/**
 * §23.1 — the project-level Workflow master switch.
 *
 * While the project is off, no workflow is enforced, so the list below is
 * configuration only; the notice spells that out instead of leaving an
 * admin to guess why transitions do nothing.
 */
export const WorkflowToggle = observer(function WorkflowToggle(props: TWorkflowToggleProps) {
  const { isEnabled, isLoading, isEditable, onToggle } = props;
  const { t } = useTranslation();

  const [isSaving, setIsSaving] = useState(false);

  const handleChange = async (nextValue: boolean) => {
    setIsSaving(true);
    try {
      await onToggle(nextValue);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("project_settings.workflows.toggle.toast.success.title"),
        message: nextValue
          ? t("project_settings.workflows.toggle.toast.success.message")
          : t("project_settings.workflows.toggle.toast.success.disabled_message"),
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("project_settings.workflows.toggle.toast.error.title"),
        message: getWorkflowErrorMessage(
          error,
          nextValue
            ? t("project_settings.workflows.toggle.toast.error.message")
            : t("project_settings.workflows.toggle.toast.error.disabled_message")
        ),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-md border border-subtle p-4" data-testid="workflow-project-toggle">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-14 font-medium text-primary">{t("project_settings.workflows.toggle.title")}</span>
          <span className="text-13 text-tertiary">{t("project_settings.workflows.toggle.description")}</span>
        </div>
        <ToggleSwitch
          size="md"
          // Until the read lands the effective state is unknown, so render it
          // off rather than flashing a guess at an admin.
          value={isEnabled ?? false}
          disabled={!isEditable || isLoading || isSaving || isEnabled === undefined}
          onChange={(value) => void handleChange(value)}
        />
      </div>
      {!isLoading && isEnabled === false && (
        <p className="mt-3 text-13 text-tertiary" data-testid="workflow-project-toggle-off-notice">
          {t("project_settings.workflows.toggle.disabled_notice")}
        </p>
      )}
    </div>
  );
});
