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

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Plus } from "lucide-react";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Loader } from "@plane/ui";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
import CursorLogo from "@/app/assets/services/cursor.png?url";
import { IntegrationsMapping } from "@/components/integrations/ui/integrations-mapping";
import { CursorIntegrationService } from "@/services/integrations/cursor.service";
import type { CursorProjectMapping } from "@/services/integrations/cursor.service";
import { CursorSettingsForm } from "./settings-form";
import { ProjectMappingModal } from "./project-mapping-modal";

const cursorService = new CursorIntegrationService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));

export const CursorIntegrationRoot = observer(function CursorIntegrationRoot() {
  const { currentWorkspace } = useWorkspace();
  const { getProjectById } = useProject();
  const workspaceId = currentWorkspace?.id;
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [editMapping, setEditMapping] = useState<CursorProjectMapping | null>(null);

  const { data, isLoading, mutate } = useSWR(
    workspaceId ? `CURSOR_SETTINGS_${workspaceId}` : null,
    workspaceId ? () => cursorService.getSettings(workspaceId) : null,
    { revalidateOnFocus: false, errorRetryCount: 0 }
  );

  const {
    data: projectMappings,
    isLoading: isMappingsLoading,
    mutate: mutateMappings,
  } = useSWR(
    workspaceId ? `CURSOR_PROJECT_MAPPINGS_${workspaceId}` : null,
    workspaceId ? () => cursorService.getProjectMappings(workspaceId) : null,
    { revalidateOnFocus: false, errorRetryCount: 0 }
  );

  const handleSave = async (payload: { apiKey?: string; repository: string; ref?: string }) => {
    if (!workspaceId) return;
    try {
      await cursorService.saveSettings(workspaceId, payload);
      await mutate();
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Success", message: "Cursor settings saved." });
    } catch (error) {
      const message =
        typeof error === "string"
          ? error
          : (error as Record<string, string>)?.error || "Failed to save Cursor settings.";
      setToast({ type: TOAST_TYPE.ERROR, title: "Error", message });
      throw error;
    }
  };

  const handleSaveMapping = async (data: { projectId: string; repository: string; ref?: string }) => {
    if (!workspaceId) return;
    try {
      // If editing, delete the old mapping first
      if (editMapping) {
        await cursorService.deleteProjectMapping(workspaceId, editMapping.id);
      }
      await cursorService.createProjectMapping(workspaceId, data);
      await mutateMappings();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: editMapping ? "Project mapping updated." : "Project mapping created.",
      });
    } catch (error) {
      const message =
        typeof error === "string"
          ? error
          : (error as Record<string, string>)?.error || "Failed to save project mapping.";
      setToast({ type: TOAST_TYPE.ERROR, title: "Error", message });
      throw error;
    }
  };

  const handleOpenCreateModal = () => {
    setEditMapping(null);
    setIsMappingModalOpen(true);
  };

  const handleOpenEditModal = (mapping: CursorProjectMapping) => {
    setEditMapping(mapping);
    setIsMappingModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsMappingModalOpen(false);
    setEditMapping(null);
  };

  const handleDeleteMapping = async (entityConnectionId: string) => {
    if (!workspaceId) return;
    try {
      await cursorService.deleteProjectMapping(workspaceId, entityConnectionId);
      await mutateMappings();
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Success", message: "Project mapping deleted." });
    } catch (error) {
      const message =
        typeof error === "string"
          ? error
          : (error as Record<string, string>)?.error || "Failed to delete project mapping.";
      setToast({ type: TOAST_TYPE.ERROR, title: "Error", message });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-between border border-subtle rounded-sm p-4 mb-2">
        <div className="flex items-center gap-4">
          <Loader>
            <Loader.Item height="44px" width="44px" />
          </Loader>
          <Loader>
            <Loader.Item height="24px" width="80px" />
          </Loader>
        </div>
        <Loader.Item height="29px" width="80px" />
      </div>
    );
  }

  return (
    <>
      {/* header */}
      <div className="shrink-0 relative flex items-center gap-4 rounded-sm bg-layer-1 p-4">
        <div className="shrink-0 w-10 h-10 relative flex justify-center items-center overflow-hidden">
          <img src={CursorLogo} alt="Cursor Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="text-body-sm-medium">Cursor</div>
          <div className="text-body-xs-regular text-secondary">
            Connect Cursor to automate coding tasks with AI-powered agents on your repositories.
          </div>
        </div>
      </div>
      {/* settings */}
      <div className="shrink-0 relative flex flex-col py-4 px-2">
        <div className="font-medium mb-4">Configuration</div>
        <CursorSettingsForm
          initialRepository={data?.repository || ""}
          initialRef={data?.ref || ""}
          hasApiKey={data?.hasApiKey || false}
          onSave={handleSave}
        />
      </div>
      {/* project mappings */}
      <div className="relative w-full space-y-4 py-4 px-2">
        <div className="border border-subtle rounded-md overflow-hidden">
          {/* Header */}
          <div className="flex flex-row items-center justify-between py-5 px-5 bg-layer-1 border-b border-subtle">
            <div className="space-y-1">
              <div className="text-body-sm-medium">Project Mappings</div>
              <div className="text-body-xs-regular text-secondary">
                Map projects to specific repositories. Unmapped projects use the default repository above.
              </div>
            </div>
            <Button variant="secondary" className="h-8 w-8 rounded-sm p-0" onClick={handleOpenCreateModal}>
              <Plus className="h-5 w-5" />
              <span className="sr-only">Add project mapping</span>
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 bg-surface-1">
            {isMappingsLoading ? (
              <Loader>
                <Loader.Item height="48px" width="100%" />
              </Loader>
            ) : projectMappings && projectMappings.length > 0 ? (
              <div className="space-y-3">
                {projectMappings.map((mapping) => {
                  const project = getProjectById(mapping.project_id);
                  if (!project) return null;
                  return (
                    <IntegrationsMapping
                      key={mapping.id}
                      entityName={
                        <div className="flex items-center gap-1">
                          <span className="truncate">{mapping.entity_data.repository}</span>
                          {mapping.entity_data.ref && (
                            <span className="text-tertiary shrink-0">({mapping.entity_data.ref})</span>
                          )}
                        </div>
                      }
                      project={project}
                      connectorLogo={CursorLogo}
                      handleEditOpen={() => handleOpenEditModal(mapping)}
                      handleDeleteOpen={() => void handleDeleteMapping(mapping.id)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-secondary">
                <p className="text-body-xs-regular text-secondary">
                  No project mappings configured. All projects will use the default repository.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {workspaceId && (
        <ProjectMappingModal
          isOpen={isMappingModalOpen}
          onClose={handleCloseModal}
          workspaceId={workspaceId}
          cursorService={cursorService}
          existingMappings={projectMappings || []}
          editMapping={editMapping}
          onSave={handleSaveMapping}
        />
      )}
      {/* info */}
      <div className="shrink-0 relative flex flex-col border-t border-subtle py-4 px-2">
        <div className="text-body-xs-regular text-secondary">
          You can customize the Cursor agent&apos;s behaviour such as rules, model selection, and tool access from your{" "}
          <a
            href="https://cursor.com/settings"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link-primary hover:underline"
          >
            Cursor Settings
          </a>
          .
        </div>
      </div>
    </>
  );
});
