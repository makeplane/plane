/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { Fragment } from "react";
import { observer } from "mobx-react";
// plane imports
import type { IProject } from "@plane/types";
import { E_FEATURE_FLAGS } from "@plane/constants";

import { useProject } from "@/hooks/store/use-project";

import { DefaultArchiveAutomation } from "./archive-automation";
import { DefaultCloseAutomation } from "./close-automation";
import { DefaultCloseAutomationState } from "./close-automation-state";
import { DefaultReminderAutomation } from "./reminder-automation";
import { DefaultAutomationItem } from "./automation-item";
import type { DefaultAutomation, DefaultAutomationContentProps } from "./types";

const DEFAULT_AUTOMATIONS: DefaultAutomation[] = [
  {
    type: "archive_in",
    i18n_name: "project_settings.automations.auto-archive.title",
    i18n_description: "project_settings.automations.auto-archive.description",
    defaultValue: 1,
    content: [
      {
        type: "archive_in",
        i18n_name: "project_settings.automations.auto-archive.duration",
        component: (props: DefaultAutomationContentProps) => <DefaultArchiveAutomation {...props} />,
        i18n_button_label: "common.customize_time_range",
      },
    ],
  },
  {
    type: "close_in",
    i18n_name: "project_settings.automations.auto-close.title",
    i18n_description: "project_settings.automations.auto-close.description",
    defaultValue: 1,
    content: [
      {
        type: "close_in",
        i18n_name: "project_settings.automations.auto-close.duration",
        component: (props: DefaultAutomationContentProps) => <DefaultCloseAutomation {...props} />,
        i18n_button_label: "common.customize_time_range",
      },
      {
        type: "close_in_status",
        i18n_name: "project_settings.automations.auto-close.auto_close_status",
        component: (props: DefaultAutomationContentProps) => <DefaultCloseAutomationState {...props} />,
      },
    ],
  },
  {
    type: "auto_reminder_days",
    i18n_name: "project_settings.automations.auto-remind.title",
    i18n_description: "project_settings.automations.auto-remind.description",
    defaultValue: 1,
    content: [
      {
        type: "auto_reminder_days",
        i18n_name: "project_settings.automations.auto-remind.duration",
        component: (props: DefaultAutomationContentProps) => <DefaultReminderAutomation {...props} />,
      },
    ],
    feature_flag: E_FEATURE_FLAGS.DUE_DATE_REMINDER,
  },
];

type DefaultAutomationRootProps = {
  workspaceSlug: string;
  projectId: string;
  handleChange: (payload: Partial<IProject>) => Promise<void>;
};

function AutomationRoot(props: DefaultAutomationRootProps) {
  const { workspaceSlug, projectId, handleChange } = props;

  const { getProjectById } = useProject();
  const currentProjectDetails = getProjectById(projectId);

  return (
    <div className="flex flex-col gap-4">
      {DEFAULT_AUTOMATIONS.map((automation) => (
        <Fragment key={automation.type}>
          <DefaultAutomationItem
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            automation={automation}
            value={
              currentProjectDetails?.[automation.type] !== undefined && currentProjectDetails?.[automation.type] !== 0
                ? (currentProjectDetails?.[automation.type] ?? automation.defaultValue)
                : 0
            }
            handleChange={(payload: Partial<IProject>) => {
              void handleChange(payload);
            }}
          />
        </Fragment>
      ))}
    </div>
  );
}

export const DefaultAutomationRoot = observer(AutomationRoot);
