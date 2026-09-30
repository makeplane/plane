/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
import { mutate } from "swr";
import { ArrowDownToLine, ArrowUpToLine } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Tabs } from "@plane/propel/tabs";
// constants
import { EXPORT_SERVICES_LIST, PROJECT_IMPORT_SERVICES_LIST } from "@/constants/fetch-keys";
import { PrevImports } from "@/components/importer/prev-imports";
import { WorkItemImportForm } from "@/components/importer/work-item-import-form";
import { ExportForm } from "./export-form";
import { PrevExports } from "./prev-exports";

const EXPORT_TAB = "work-items-export";
const IMPORT_TAB = "work-items-import";

export const ExportGuide = observer(function ExportGuide() {
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const provider = searchParams.get("provider");
  const per_page = 10;
  const [exportCursor, setExportCursor] = useState<string | undefined>(`10:0:0`);
  const [importCursor, setImportCursor] = useState<string | undefined>(`10:0:0`);

  // /settings/imports redirects here with #import, so the hash picks the tab that opens
  const defaultTab = useMemo(
    () => (typeof window !== "undefined" && window.location.hash === "#import" ? IMPORT_TAB : EXPORT_TAB),
    []
  );

  return (
    <Tabs defaultValue={defaultTab} className="gap-y-6">
      <Tabs.List className="h-8 w-fit min-w-64">
        <Tabs.Trigger value={EXPORT_TAB} className="gap-1.5 px-4">
          <ArrowUpToLine className="size-4" />
          {t("workspace_settings.settings.exports.tabs.export")}
        </Tabs.Trigger>
        <Tabs.Trigger value={IMPORT_TAB} className="gap-1.5 px-4">
          <ArrowDownToLine className="size-4" />
          {t("workspace_settings.settings.exports.tabs.import")}
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value={EXPORT_TAB} className="flex w-full flex-col gap-y-13">
        <ExportForm
          workspaceSlug={workspaceSlug as string}
          provider={provider}
          mutateServices={() => mutate(EXPORT_SERVICES_LIST(workspaceSlug as string, `${exportCursor}`, `${per_page}`))}
        />
        <PrevExports
          workspaceSlug={workspaceSlug as string}
          cursor={exportCursor}
          per_page={per_page}
          setCursor={setExportCursor}
        />
      </Tabs.Content>

      <Tabs.Content value={IMPORT_TAB} className="flex w-full flex-col gap-y-13">
        <WorkItemImportForm
          mutateServices={() =>
            mutate(PROJECT_IMPORT_SERVICES_LIST(workspaceSlug as string, `${importCursor}`, `${per_page}`))
          }
        />
        <PrevImports
          workspaceSlug={workspaceSlug as string}
          cursor={importCursor}
          per_page={per_page}
          setCursor={setImportCursor}
        />
      </Tabs.Content>
    </Tabs>
  );
});
