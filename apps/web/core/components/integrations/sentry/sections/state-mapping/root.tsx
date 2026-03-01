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

import type { FC } from "react";
import { useState, useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { PlusIcon } from "@plane/propel/icons";
import type { TSentryConfig, TSentryStateMapping } from "@plane/etl/sentry";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Loader } from "@plane/ui";
// plane web components
import { useProject } from "@/hooks/store/use-project";
import { useSentryIntegration } from "@/plane-web/hooks/store/integrations/use-sentry";
import { StateMappingForm } from "./form/index";
import { StateMappingItem } from "./state-mapping-item";

export const SentryStateMappingRoot = observer(function SentryStateMappingRoot({
  connectionId,
}: {
  connectionId: string;
}) {
  // hooks
  const { workspace, getAppByConnectionId, fetchAppConnections, updateAppConnection } = useSentryIntegration();
  const { joinedProjectIds } = useProject();
  const { t } = useTranslation();

  // states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editMapping, setEditMapping] = useState<TSentryStateMapping | null>(null);

  // derived values
  const workspaceId = workspace?.id || undefined;
  const appConnection = getAppByConnectionId(connectionId);

  // Memoize stateMappings to prevent useMemo dependency changes on every render
  const stateMappings: TSentryStateMapping[] = useMemo(
    () => appConnection?.config?.stateMappings || [],
    [appConnection?.config?.stateMappings]
  );

  // fetching app connections - simplified
  const {
    isLoading: isAppConnectionsLoading,
    error: appConnectionsError,
    mutate: mutateAppConnections,
  } = useSWR(
    workspaceId ? `SENTRY_APP_CONNECTIONS_${workspaceId}` : null,
    workspaceId ? async () => fetchAppConnections() : null,
    {
      errorRetryCount: 0,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  // Combined error state
  const hasError = appConnectionsError;

  // Memoized handlers to prevent re-renders
  const handleRefresh = useCallback(() => {
    mutateAppConnections();
  }, [mutateAppConnections]);

  const handleOpenCreateModal = useCallback(() => {
    setEditMapping(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((mapping: TSentryStateMapping) => {
    setEditMapping(mapping);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditMapping(null);
  }, []);

  // Handle form submission - simplified without cache management since store handles updates
  const handleSubmit = useCallback(
    async (projectId: string, resolvedState: any, unresolvedState: any) => {
      if (!appConnection) {
        return;
      }

      try {
        const currentMappings = appConnection.config?.stateMappings || [];
        let updatedMappings: TSentryStateMapping[];

        if (editMapping) {
          // Update existing mapping
          updatedMappings = currentMappings.map((mapping: TSentryStateMapping) =>
            mapping.projectId === editMapping.projectId ? { projectId, resolvedState, unresolvedState } : mapping
          );
        } else {
          // Create new mapping
          updatedMappings = [...currentMappings, { projectId, resolvedState, unresolvedState }];
        }

        const updatedConfig = {
          ...appConnection.config,
          stateMappings: updatedMappings,
        };

        const updatedConnection = {
          ...appConnection,
          config: updatedConfig,
        };

        // Store will automatically update observable state and trigger UI re-render
        await updateAppConnection(connectionId, updatedConnection);

        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: editMapping ? "State mapping updated successfully" : "State mapping created successfully",
        });

        handleCloseModal();
      } catch (error) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to save state mapping",
        });
      }
    },
    [appConnection, editMapping, connectionId, updateAppConnection, handleCloseModal]
  );

  // Handle delete mapping - simplified without cache management since store handles updates
  const handleDelete = useCallback(
    async (mapping: TSentryStateMapping) => {
      if (!appConnection) return;

      try {
        const config = appConnection.config;
        const currentMappings = config.stateMappings || [];
        const updatedMappings = currentMappings.filter((m: TSentryStateMapping) => m.projectId !== mapping.projectId);

        const updatedConfig = {
          ...appConnection.config,
          stateMappings: updatedMappings,
        };

        const updatedConnection = {
          ...appConnection,
          config: updatedConfig,
        };

        // Store will automatically update observable state and trigger UI re-render
        await updateAppConnection(connectionId, updatedConnection);

        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "State mapping deleted successfully",
        });
      } catch (error) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to delete state mapping",
        });
      }
    },
    [appConnection, connectionId, updateAppConnection]
  );

  // Get available projects - memoized to prevent re-computation
  const availableProjects = useMemo(() => {
    const mappedProjectIds = stateMappings.map((mapping) => mapping.projectId);
    return joinedProjectIds?.filter((projectId) => !mappedProjectIds.includes(projectId)) || [];
  }, [stateMappings, joinedProjectIds]);

  // Loading state with skeleton loader
  if (isAppConnectionsLoading) {
    return (
      <div className="relative w-full space-y-4">
        <div className="border border-subtle rounded-md overflow-hidden">
          <Loader>
            {/* Header skeleton */}
            <div className="flex flex-row items-center justify-between py-3 px-4 bg-layer-1 border-b border-subtle">
              <div className="space-y-1">
                <Loader.Item height="24px" width="180px" />
                <Loader.Item height="18px" width="280px" />
              </div>
              <Loader.Item height="32px" width="32px" className="rounded" />
            </div>

            {/* Content skeleton */}
            <div className="p-4 bg-surface-1">
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="border border-subtle rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Loader.Item height="24px" width="24px" className="rounded-md" />
                        <Loader.Item height="20px" width="140px" />
                      </div>
                      <div className="flex gap-2">
                        <Loader.Item height="24px" width="60px" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <Loader.Item height="16px" width="90px" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Loader>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="relative w-full space-y-4">
        <div className="border border-subtle rounded-md overflow-hidden">
          <div className="flex flex-row items-center justify-between py-3 px-4 bg-layer-1 border-b border-subtle">
            <div className="text-body-sm-medium">{t("sentry_integration.state_mapping.title")}</div>
            <Button variant="secondary" onClick={handleRefresh} className="flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              {t("retry")}
            </Button>
          </div>
          <div className="p-8 flex flex-col items-center justify-center text-center bg-surface-1">
            <div className="w-10 h-10 bg-layer-1 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-5 w-5 text-placeholder" />
            </div>
            <p className="text-body-xs-medium text-primary mb-1">
              {t("sentry_integration.state_mapping.failed_loading_state_mappings")}
            </p>
            <Button variant="primary" onClick={handleRefresh} className="flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              {t("retry")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full space-y-4">
      <div className="border border-subtle rounded-md overflow-hidden">
        {/* Header */}
        <div className="flex flex-row items-center justify-between py-5 px-5 bg-layer-1 border-b border-subtle">
          <div className="space-y-1">
            <div className="text-body-sm-medium">{t("sentry_integration.state_mapping.title")}</div>
            <div className="text-body-xs-regular text-secondary">
              {t("sentry_integration.state_mapping.description")}
            </div>
          </div>
          <Button
            variant="secondary"
            className="h-8 w-8 rounded-sm p-0"
            onClick={handleOpenCreateModal}
            disabled={availableProjects.length === 0}
          >
            <PlusIcon className="h-5 w-5" />
            <span className="sr-only">{t("sentry_integration.state_mapping.add_new_state_mapping")}</span>
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 bg-surface-1">
          {stateMappings && stateMappings.length > 0 ? (
            <div className="space-y-3">
              {stateMappings.map((mapping) => (
                <StateMappingItem
                  key={mapping.projectId}
                  mapping={mapping}
                  onEdit={() => handleEdit(mapping)}
                  onDelete={() => handleDelete(mapping)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-secondary">
              <p className="text-body-xs-regular text-secondary mb-2">
                {t("sentry_integration.state_mapping.empty_state")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Form modal for both create and edit */}
      <StateMappingForm
        modal={isModalOpen}
        handleModal={handleCloseModal}
        handleSubmit={handleSubmit}
        stateMapping={editMapping || undefined}
        availableProjects={availableProjects}
      />
    </div>
  );
});
