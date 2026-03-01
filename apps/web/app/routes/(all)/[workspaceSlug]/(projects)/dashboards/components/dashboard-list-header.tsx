/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";

type Props = {
  onCreateClick: () => void;
};

export const DashboardListHeader = observer(function DashboardListHeader({ onCreateClick }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between border-b border-color-subtle px-4 py-3">
      <div>
        <h1 className="text-xl font-semibold text-color-primary">{t("dashboards")}</h1>
        <p className="text-sm text-color-secondary">{t("analytics_dashboard.list_description")}</p>
      </div>
      <Button variant="primary" size="sm" onClick={onCreateClick}>
        <Plus className="h-4 w-4" />
        {t("analytics_dashboard.create")}
      </Button>
    </div>
  );
});
