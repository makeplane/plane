"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
// import { useSearchParams } from "next/navigation";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { AlertModalCore } from "@plane/ui";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import { ApplicationConfigurationCard } from "./components/application-configuration-card";
import { ApplicationFormModal } from "./components/application-form-modal";
import { CollapsibleConfigurationCard } from "./components/collapsible-configuration-card";
import { ServerConfigurationContent } from "./components/server-configuration-content";
import { VirtualHostConfigurationContent } from "./components/virtual-host-configuration-content";
import { createApplication, fetchMediaServerData, removeApplication } from "./media-server.api";
import { EMPTY_VIRTUAL_HOST } from "./media-server.types";
import type { TVirtualHostState } from "./media-server.types";
import { getCpServerBaseUrl, getErrorMessage } from "./media-server.utils";

const WorkspaceMediaServerSettingsPage = observer(() => {
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  // const searchParams = useSearchParams();

  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Media Server` : undefined;
  // const forceSkeleton = searchParams.get("skeleton") === "1";

  const cpServerBaseUrl = useMemo(() => getCpServerBaseUrl(), []);

  const [applications, setApplications] = useState<string[]>([]);
  const [newApplicationName, setNewApplicationName] = useState("");
  const [virtualHost, setVirtualHost] = useState<TVirtualHostState>(EMPTY_VIRTUAL_HOST);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isServerConfigOpen, setIsServerConfigOpen] = useState<boolean>(false);
  const [isVirtualHostOpen, setIsVirtualHostOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [applicationToDelete, setApplicationToDelete] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const loadMediaServerData = useCallback(async () => {
    if (!cpServerBaseUrl) {
      setError("NEXT_PUBLIC_CP_SERVER_URL is not configured.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchMediaServerData(cpServerBaseUrl);
      setApplications(data.applications);
      setVirtualHost(data.virtualHost);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load media server details."));
    } finally {
      setIsLoading(false);
    }
  }, [cpServerBaseUrl]);

  useEffect(() => {
    void loadMediaServerData();
  }, [loadMediaServerData]);

  const resolveCpServerBaseUrl = useCallback(() => {
    if (cpServerBaseUrl) return cpServerBaseUrl;

    setToast({
      type: TOAST_TYPE.ERROR,
      title: "NEXT_PUBLIC_CP_SERVER_URL is not configured.",
    });

    return null;
  }, [cpServerBaseUrl]);

  const handleAddApplication = useCallback(async () => {
    const trimmedName = newApplicationName.trim();

    if (!trimmedName) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Application name is required.",
      });
      return;
    }

    const baseUrl = resolveCpServerBaseUrl();
    if (!baseUrl) return;

    setIsMutating(true);

    try {
      await createApplication(baseUrl, trimmedName);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Application added.",
      });
      setNewApplicationName("");
      setIsCreateModalOpen(false);
      await loadMediaServerData();
    } catch (err) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: getErrorMessage(err, "Unable to add application."),
      });
    } finally {
      setIsMutating(false);
    }
  }, [loadMediaServerData, newApplicationName, resolveCpServerBaseUrl]);

  const handleDeleteApplication = useCallback(
    async (applicationName: string) => {
      const baseUrl = resolveCpServerBaseUrl();
      if (!baseUrl) return;

      setIsMutating(true);

      try {
        await removeApplication(baseUrl, applicationName);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Application removed.",
        });
        await loadMediaServerData();
      } catch (err) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: getErrorMessage(err, "Unable to remove application."),
        });
      } finally {
        setIsMutating(false);
      }
    },
    [loadMediaServerData, resolveCpServerBaseUrl]
  );

  const openDeleteModal = (applicationName: string) => {
    setApplicationToDelete(applicationName);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setApplicationToDelete(null);
  };

  const handleConfirmDeleteApplication = async () => {
    if (!applicationToDelete) return;
    await handleDeleteApplication(applicationToDelete);
    closeDeleteModal();
  };

  const openCreateModal = () => {
    setNewApplicationName("");
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper size="lg">
      <PageHead title={pageTitle} />
      <div className="w-full">
        <SettingsHeading
          title="Media Server"
          description="Manage applications and inspect server/virtual host details for your workspace media server."
        />

        <div className="mt-6 space-y-4">
          <ApplicationConfigurationCard
            applications={applications}
            isLoading={isLoading}
            isMutating={isMutating}
            onOpenCreateModal={openCreateModal}
            onDeleteApplication={(applicationName) => {
              openDeleteModal(applicationName);
            }}
          />

          <CollapsibleConfigurationCard
            title="Server Configuration"
            isOpen={isServerConfigOpen}
            onToggle={() => setIsServerConfigOpen((state) => !state)}
          >
            <ServerConfigurationContent hostName={virtualHost.hostName} />
          </CollapsibleConfigurationCard>

          <CollapsibleConfigurationCard
            title="Virtual Host Configuration"
            isOpen={isVirtualHostOpen}
            onToggle={() => setIsVirtualHostOpen((state) => !state)}
          >
            <VirtualHostConfigurationContent virtualHost={virtualHost} />
          </CollapsibleConfigurationCard>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>

      <AlertModalCore
        handleClose={closeDeleteModal}
        handleSubmit={() => {
          void handleConfirmDeleteApplication();
        }}
        isSubmitting={isMutating}
        isOpen={isDeleteModalOpen}
        title="Delete application"
        content={
          <>
            Are you sure you want to delete{" "}
            <span className="font-medium text-custom-text-100">{applicationToDelete ?? "this application"}</span>? This
            action cannot be undone.
          </>
        }
      />

      <ApplicationFormModal
        isOpen={isCreateModalOpen}
        isSubmitting={isMutating}
        applicationName={newApplicationName}
        onApplicationNameChange={setNewApplicationName}
        onClose={closeCreateModal}
        onSubmit={() => {
          void handleAddApplication();
        }}
      />
    </SettingsContentWrapper>
  );
});

export default WorkspaceMediaServerSettingsPage;
