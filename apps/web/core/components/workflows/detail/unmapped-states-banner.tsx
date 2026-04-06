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

import { observer } from "mobx-react";
import { AlertIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { StatePill } from "../workflow-tree/state-pill";

type Props = {
  stateIds: string[];
};

export const WorkflowUnmappedStatesBanner = observer(function WorkflowUnmappedStatesBanner(props: Props) {
  const { stateIds } = props;
  const { t } = useTranslation();

  if (stateIds.length === 0) return null;

  return (
    <div className="rounded-lg bg-warning-subtle px-4 py-3 shadow-raised-200">
      <div className="flex items-start gap-2">
        <AlertIcon className="mt-0.5 size-4 shrink-0 text-warning-secondary" />
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-body-md-medium text-warning-secondary">
              {t("project_settings.workflows.detail.unmapped_states.title")}
            </p>
            <p className="text-body-xs-medium text-warning-secondary">
              {t("project_settings.workflows.detail.unmapped_states.description")}
            </p>
            <p className="text-body-xs-medium text-warning-secondary">
              {t("project_settings.workflows.detail.unmapped_states.note")}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <p className="pt-1 text-body-xs-medium text-secondary">
              {t("project_settings.workflows.detail.unmapped_states.label")}
            </p>
            <div className="flex flex-wrap gap-2">
              {stateIds.map((stateId) => (
                <StatePill key={stateId} stateId={stateId} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
