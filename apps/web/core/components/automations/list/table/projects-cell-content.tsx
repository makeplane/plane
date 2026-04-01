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
// plane imports
import { useTranslation } from "@plane/i18n";
import { Badge } from "@plane/propel/badge";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { EPillSize, EPillVariant, ERadius, Pill } from "@plane/propel/pill";
// hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  projectIds: string[];
};

export const AutomationsTableProjectsCellContent = observer(function AutomationsTableProjectsCellContent({
  projectIds,
}: Props) {
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const project = projectIds.length > 0 ? getProjectById(projectIds[0]) : undefined;
  // translation
  const { t } = useTranslation();

  if (projectIds.length === 1) {
    return (
      <Pill size={EPillSize.SM} variant={EPillVariant.DEFAULT} radius={ERadius.SQUARE} className="gap-1.5">
        <Logo logo={project?.logo_props} size={14} /> {project?.name}
      </Pill>
    );
  }

  return (
    <Badge size="sm" variant={projectIds.length === 0 ? "warning" : "brand"}>
      {projectIds.length === 0
        ? t("automations.global_automations.table.scope.project.all")
        : t("automations.global_automations.table.scope.project.multiple")}
    </Badge>
  );
});
