"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Plus, AlertTriangle, RefreshCw } from "lucide-react";
import { E_SLACK_ENTITY_TYPE, TSlackProjectUpdatesConfig } from "@plane/etl/slack";
import { useTranslation } from "@plane/i18n";
import { TWorkspaceEntityConnection } from "@plane/types";
import { Button, Loader, TOAST_TYPE, setToast } from "@plane/ui";
// plane web components
//  plane web hooks
// plane web types
import { useSlackIntegration } from "@/plane-web/hooks/store";
import { ConnectionItem } from "./entity-item";
import ProjectUpdatesForm from "./form/form";

export const ProjectUpdatesRoot: FC<{ connectionId: string }> = observer(({ connectionId }) => {
  // hooks
  const {
    workspace,
    getProjectConnectionsByWorkspaceId,
    fetchProjectConnections,
    fetchProjects,
    createProjectConnection,
    updateProjectConnection,
    deleteProjectConnection,
  } = useSlackIntegration();

  const { t } = useTranslation();

  // states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editConnection, setEditConnection] = useState<TWorkspaceEntityConnection<TSlackProjectUpdatesConfig> | null>(
    null
  );

  // derived values
  const workspaceId = workspace?.id || undefined;
  const workspaceSlug = workspace?.slug || undefined;
  const projectConnections = getProjectConnectionsByWorkspaceId(workspaceId!);

  // fetching external api token
  const {
    isLoading: isProjectConnectionsLoading,
    error: projectConnectionsError,
    mutate: reloadProjectConnections,
  } = useSWR(
    workspaceId ? `INTEGRATION_SLACK_PROJECT_CONNECTIONS_${workspaceId}` : null,
    workspaceId ? async () => fetchProjectConnections() : null,
    { errorRetryCount: 0 }
  );

  /*
    We are fetching projects here, as well need projects for both
    the dropdowns in the form and also for the entity items
  */
  const {
    isLoading: isProjectLoading,
    error: projectsError,
    mutate: reloadProjects,
  } = useSWR(
    workspaceSlug ? `INTEGRATION_SLACK_PROJECTS_${workspaceSlug}` : null,
    workspaceSlug ? async () => fetchProjects(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  // Combined loading state
  const isLoading = isProjectConnectionsLoading || isProjectLoading;

  // Combined error state
  const hasError = projectConnectionsError || projectsError;

  const handleRefresh = () => {
    reloadProjectConnections();
    reloadProjects();
  };

  // Handle opening the modal for creating a new connection
  const handleOpenCreateModal = () => {
    setEditConnection(null); // Ensure we're not in edit mode
    setIsModalOpen(true);
  };

  // Handle opening the modal for editing an existing connection
  const handleEdit = (connection: TWorkspaceEntityConnection<TSlackProjectUpdatesConfig>) => {
    setEditConnection(connection);
    setIsModalOpen(true);
  };

  // Handle closing the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditConnection(null);
  };

  // Handle form submission (creates new or updates existing)
  const handleSubmit = async (projectId: string, channelId: string, channelName: string) => {
    if (editConnection) {
      // Update existing connection
      const updatedConnection = {
        ...editConnection,
        project_id: projectId,
        entity_id: channelId,
        entity_slug: channelName,
      };

      await updateProjectConnection(editConnection.id, updatedConnection);
      setEditConnection(null);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Project connection updated successfully",
      });
    } else {
      // Create new connection
      try {
        const entityConnection: Partial<TWorkspaceEntityConnection<TSlackProjectUpdatesConfig>> = {
          workspace_id: workspaceId!,
          project_id: projectId,
          entity_id: channelId,
          entity_slug: channelName,
          entity_type: E_SLACK_ENTITY_TYPE.SLACK_PROJECT_UPDATES,
          workspace_connection_id: connectionId,
          workspace_slug: workspaceSlug!,
          entity_data: {},
          config: {
            events: [],
          },
        };

        await createProjectConnection(entityConnection as TWorkspaceEntityConnection<TSlackProjectUpdatesConfig>);

        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Project connection created successfully",
        });
      } catch (error) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to create project connection",
        });
      }
    }
  };

  // Handle delete handler
  const handleDelete = async (connection: TWorkspaceEntityConnection<TSlackProjectUpdatesConfig>) => {
    try {
      await deleteProjectConnection(connection.id);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to delete project connection",
      });
    }
  };

  // Loading state with skeleton loader
  if (isLoading) {
    return (
      <div className="relative w-full space-y-4">
        <div className="border border-custom-border-200 rounded-md overflow-hidden">
          <Loader>
            {/* Header skeleton */}
            <div className="flex flex-row items-center justify-between py-3 px-4 bg-custom-background-90 border-b border-custom-border-200">
              <div className="space-y-1">
                <Loader.Item height="24px" width="180px" />
                <Loader.Item height="18px" width="280px" />
              </div>
              <Loader.Item height="32px" width="32px" className="rounded" />
            </div>

            {/* Content skeleton */}
            <div className="p-4 bg-custom-background-100">
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="border border-custom-border-200 rounded-md p-3">
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
        <div className="border border-custom-border-200 rounded-md overflow-hidden">
          <div className="flex flex-row items-center justify-between py-3 px-4 bg-custom-background-90 border-b border-custom-border-200">
            <div className="text-base font-medium">{t("slack_integration.project_updates.title")}</div>
            <Button variant="neutral-primary" size="sm" onClick={handleRefresh} className="flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              {t("retry")}
            </Button>
          </div>
          <div className="p-8 flex flex-col items-center justify-center text-center bg-custom-background-100">
            <div className="w-10 h-10 bg-custom-background-90 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-5 w-5 text-custom-text-400" />
            </div>
            <p className="text-sm font-medium text-custom-text-100 mb-1">
              {t("slack_integration.project_updates.project_updates_form.failed_loading_project_connections")}
            </p>
            <Button variant="primary" size="sm" onClick={handleRefresh} className="flex items-center gap-1">
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
      <div className="border border-custom-border-200 rounded-md overflow-hidden">
        {/* Header */}
        <div className="flex flex-row items-center justify-between py-5 px-5 bg-custom-background-90 border-b border-custom-border-200">
          <div className="space-y-1">
            <div className="text-base font-medium">{t("slack_integration.project_updates.title")}</div>
            <div className="text-sm text-custom-text-200">{t("slack_integration.project_updates.description")}</div>
          </div>
          <Button variant="neutral-primary" size="sm" className="h-8 w-8 rounded p-0" onClick={handleOpenCreateModal}>
            <Plus className="h-5 w-5" />
            <span className="sr-only">{t("slack_integration.project_updates.add_new_project_update")}</span>
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 bg-custom-background-100">
          {projectConnections && projectConnections.length > 0 ? (
            <div className="space-y-3">
              {projectConnections.map((connection) => (
                <ConnectionItem
                  key={connection.id}
                  connection={connection}
                  onEdit={() => handleEdit(connection)}
                  onDelete={() => handleDelete(connection)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-custom-text-200">
              <p className="text-sm text-custom-text-200 mb-2">
                {t("slack_integration.project_updates.project_updates_empty_state")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Single form instance for both create and edit */}
      <ProjectUpdatesForm
        modal={isModalOpen}
        handleModal={handleCloseModal}
        handleSubmit={handleSubmit}
        projectConnection={editConnection || undefined}
      />
    </div>
  );
});
