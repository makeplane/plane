/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR, { mutate } from "swr";
import {
  EUserPermissions,
  EUserPermissionsLevel,
  IMPORTABLE_IMPORTER_STATUSES,
  IMPORTER_SERVICES_LIST,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IImporterService } from "@plane/types";
import { cn } from "@plane/utils";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { ImportHistoryList, ImportHub } from "@/components/importers";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import { IntegrationService } from "@/services/integrations";
import { ImportsWorkspaceSettingsHeader } from "./header";

const integrationService = new IntegrationService();

function ImportsPage() {
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.imports.title")}`
    : undefined;
  const importerServicesKey = currentWorkspace?.slug ? IMPORTER_SERVICES_LIST(currentWorkspace.slug) : null;
  const { data: importerServices, isLoading } = useSWR(
    importerServicesKey,
    currentWorkspace?.slug ? () => integrationService.getImporterServicesList(currentWorkspace.slug) : null,
    {
      refreshInterval: (services) =>
        services?.some((service) => IMPORTABLE_IMPORTER_STATUSES.has(service.status)) ? 3000 : 0,
    }
  );

  const handleCancelImport = async (service: IImporterService) => {
    if (!currentWorkspace?.slug) return;
    setCancellingId(service.id);
    try {
      await integrationService.deleteImporterService(currentWorkspace.slug, service.service, service.id);
      await mutate(importerServicesKey);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.imports.history.cancel_success_title"),
        message: t("workspace_settings.settings.imports.history.cancel_success_message"),
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.imports.history.cancel_failed_title"),
        message: t("workspace_settings.settings.imports.history.cancel_failed_message"),
      });
    } finally {
      setCancellingId(null);
    }
  };

  if (workspaceUserInfo && !canPerformWorkspaceMemberActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<ImportsWorkspaceSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <div className={cn("flex w-full flex-col gap-y-6", { "opacity-60": !canPerformWorkspaceMemberActions })}>
        <SettingsHeading
          title={t("workspace_settings.settings.imports.heading")}
          description={t("workspace_settings.settings.imports.description")}
        />
        {currentWorkspace?.slug && (
          <ImportHub workspaceSlug={currentWorkspace.slug} disabled={!canPerformWorkspaceMemberActions} />
        )}
        {currentWorkspace?.slug && (
          <ImportHistoryList
            workspaceSlug={currentWorkspace.slug}
            importers={importerServices}
            isLoading={isLoading}
            cancellingId={cancellingId}
            onCancel={handleCancelImport}
          />
        )}
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(ImportsPage);
