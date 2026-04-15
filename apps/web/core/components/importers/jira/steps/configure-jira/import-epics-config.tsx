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

import React from "react";
// plane propel components
import { Switch } from "@plane/propel/switch";
// plane web hooks
import { useTranslation } from "@plane/i18n";
// plane web types
import type { TImporterDataPayload } from "@/types/importers";
import { E_IMPORTER_STEPS } from "@/types/importers";

type TFormData = TImporterDataPayload[E_IMPORTER_STEPS.CONFIGURE_JIRA];

interface ImportEpicsConfigProps {
  value: boolean;
  onFormDataUpdate: (key: keyof TFormData, value: boolean) => void;
}

export const ImportEpicsConfig: React.FC<ImportEpicsConfigProps> = ({ value, onFormDataUpdate }) => {
  // hooks
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-2 border border-subtle bg-layer-2 rounded-lg p-4 transition-all w-full">
      <div className="space-y-0.5">
        <div className="text-12 font-medium text-secondary tracking-tight">
          {t("jira_server_importer.import_epics.title")}
        </div>
        <div className="text-10 text-tertiary">{t("jira_server_importer.import_epics.description")}</div>
      </div>
      <div className="flex items-center gap-3">
        <Switch value={value} onChange={(val) => onFormDataUpdate("importEpicsAsWorkItems", val)} size="sm" />
      </div>
    </div>
  );
};
