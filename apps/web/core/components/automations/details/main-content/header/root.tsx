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
import { Link, useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type TProps = {
  automationId: string;
};

export const AutomationDetailsMainContentHeader = observer(function AutomationDetailsMainContentHeader(props: TProps) {
  const { automationId } = props;
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { getAutomationById } = useAutomations();
  const { getProjectById } = useProject();
  // derived values
  const automation = getAutomationById(automationId)?.asJSON;
  // translation
  const { t } = useTranslation();

  if (!automation) return null;
  return (
    <header className="flex flex-col">
      <h2 className="text-h3-medium truncate">{automation.name}</h2>
      {automation.description && (
        <p className="mt-1.5 text-body-xs-regular text-secondary line-clamp-2">{automation.description}</p>
      )}
      {automation.is_global && (
        <div className="mt-4 flex gap-3 flex-wrap">
          <p className="shrink-0 text-body-sm-regular text-secondary py-1">Automation to run on projects:</p>
          <div className="shrink-0 max-w-full flex items-center gap-2 flex-wrap">
            {automation.project_ids.length ? (
              automation.project_ids.map((projectId) => {
                const project = getProjectById(projectId);
                if (!project) return null;
                return (
                  <Link
                    to={`/${workspaceSlug}/projects/${projectId}/issues/`}
                    key={projectId}
                    className="flex items-center gap-1 bg-layer-2 hover:bg-layer-2-hover border border-subtle p-1 rounded-md"
                  >
                    <span className="shrink-0 size-4 grid place-items-center">
                      <Logo logo={project.logo_props} size={14} />
                    </span>
                    <p className="text-caption-md-regular text-tertiary">{project.name}</p>
                  </Link>
                );
              })
            ) : (
              <span className="bg-layer-2 border border-subtle p-1 rounded-md text-caption-md-regular text-tertiary">
                {t("automations.global_automations.project_select.all_projects.label")}
              </span>
            )}
          </div>
        </div>
      )}
    </header>
  );
});
