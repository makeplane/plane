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
import { useTranslation } from "@plane/i18n";
// ui
import { CycleIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// plane web components
import { UpgradeBadge } from "@/components/workspace/upgrade-badge";

export const WorkspaceActiveCycleHeader = observer(function WorkspaceActiveCycleHeader() {
  const { t } = useTranslation();
  return (
    <Header>
      <Header.LeftItem>
        <div className="flex gap-2">
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label={t("active_cycles")}
                  icon={<CycleIcon className="h-4 w-4 text-tertiary rotate-180" />}
                />
              }
            />
          </Breadcrumbs>
        </div>
        <UpgradeBadge size="md" flag="WORKSPACE_ACTIVE_CYCLES" />
      </Header.LeftItem>
    </Header>
  );
});
