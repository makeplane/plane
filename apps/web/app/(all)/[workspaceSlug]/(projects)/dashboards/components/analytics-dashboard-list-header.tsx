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

export const AnalyticsDashboardListHeader = observer(function AnalyticsDashboardListHeader({
  onCreateClick,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between border-b border-custom-border-200 px-4 py-3">
      <div>
        <h1 className="text-xl font-semibold">{t("dashboards")}</h1>
        <p className="text-sm text-custom-text-300">Create and manage analytics dashboards</p>
      </div>
      <Button variant="primary" size="sm" onClick={onCreateClick}>
        <Plus className="h-4 w-4" />
        New Dashboard
      </Button>
    </div>
  );
});
