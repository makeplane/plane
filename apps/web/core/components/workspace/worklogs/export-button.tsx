/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TTimeLogFilters } from "@plane/types";
// services
import { WorkspaceTimeLogService } from "@/services/workspace/time-log.service";

type Props = {
  workspaceSlug: string;
  filters: TTimeLogFilters;
  disabled?: boolean;
};

export const ExportWorklogsButton = ({ workspaceSlug, filters, disabled = false }: Props) => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await new WorkspaceTimeLogService().exportWorkspaceTimeLogs(workspaceSlug, filters);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("workspace_settings.settings.worklogs.export_success"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("workspace_settings.settings.worklogs.export_error"),
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button variant="primary" size="sm" onClick={handleExport} disabled={disabled || isExporting}>
      {isExporting ? t("loading") : t("common.export")}
    </Button>
  );
};
