/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Clock } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// ui
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";

export const WorkspaceReportsHeader = observer(function WorkspaceReportsHeader() {
  const { t } = useTranslation();
  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs>
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink label={t("time_reports.label")} icon={<Clock className="h-4 w-4 text-tertiary" />} />
            }
          />
        </Breadcrumbs>
      </Header.LeftItem>
    </Header>
  );
});
