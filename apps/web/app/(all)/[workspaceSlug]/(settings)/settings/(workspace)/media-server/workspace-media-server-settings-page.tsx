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
import { deleteDevice, fetchDevices } from "../devices/devices.api";
import { ApplicationConfigurationCard } from "./components/application-configuration-card";
import { ApplicationFormModal } from "./components/application-form-modal";
import { CollapsibleConfigurationCard } from "./components/collapsible-configuration-card";
import { ServerConfigurationContent } from "./components/server-configuration-content";
import { VirtualHostConfigurationContent } from "./components/virtual-host-configuration-content";
import { createApplication, fetchApplications, fetchVirtualHost, removeApplication } from "./media-server.api";
import { EMPTY_VIRTUAL_HOST } from "./media-server.types";
import type { TVirtualHostState } from "./media-server.types";
import { getCpServerBaseUrl, getErrorMessage } from "./media-server.utils";

const normalizeApplicationKey = (value: string) => value.trim().toLowerCase();

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
  const [isApplicationsLoading, setIsApplicationsLoading] = useState<boolean>(true);
  const [isVirtualHostLoading, setIsVirtualHostLoading] = useState<boolean>(false);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [virtualHostError, setVirtualHostError] = useState<string | null>(null);
  const [hasLoadedVirtualHost, setHasLoadedVirtualHost] = useState<boolean>(false);
  const [isServerConfigOpen, setIsServerConfigOpen] = useState<boolean>(false);
  const [isVirtualHostOpen, setIsVirtualHostOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [applicationToDelete, setApplicationToDelete] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const loadApplications = useCallback(async () => {
    if (!cpServerBaseUrl) {
      setApplicationsError("NEXT_PUBLIC_CP_SERVER_URL is not configured.");
      setIsApplicationsLoading(false);
      return;
    }

    setIsApplicationsLoading(true);
    setApplicationsError(null);

    try {
      setApplications(await fetchApplications(cpServerBaseUrl));
    } catch (err) {
      setApplicationsError(getErrorMessage(err, "Unable to load media server applications."));
    } finally {
      setIsApplicationsLoading(false);
    }
  }, [cpServerBaseUrl]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const loadVirtualHostData = useCallback(async () => {
    if (!cpServerBaseUrl) {
      setVirtualHostError("NEXT_PUBLIC_CP_SERVER_URL is not configured.");
      return;
    }

    setIsVirtualHostLoading(true);
    setVirtualHostError(null);

    try {
      setVirtualHost(await fetchVirtualHost(cpServerBaseUrl));
      setHasLoadedVirtualHost(true);
    } catch (err) {
      setVirtualHostError(getErrorMessage(err, "Unable to load virtual host details."));
    } finally {
      setIsVirtualHostLoading(false);
    }
  }, [cpServerBaseUrl]);

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
      await loadApplications();
    } catch (err) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: getErrorMessage(err, "Unable to add application."),
      });
    } finally {
      setIsMutating(false);
    }
  }, [loadApplications, newApplicationName, resolveCpServerBaseUrl]);

  const handleDeleteApplication = useCallback(
    async (applicationName: string) => {
      const baseUrl = resolveCpServerBaseUrl();
      if (!baseUrl) return;

      setIsMutating(true);

      try {
        const normalizedApplicationName = applicationName.trim();
        const associatedDevices = (await fetchDevices(baseUrl)).filter(
          (device) => normalizeApplicationKey(device.appName) === normalizeApplicationKey(normalizedApplicationName)
        );

        await removeApplication(baseUrl, normalizedApplicationName);

        const deviceDeletionResults = await Promise.allSettled(
          associatedDevices.map((device) => deleteDevice(baseUrl, device.id))
        );
        const failedDeviceDeletionCount = deviceDeletionResults.filter((result) => result.status === "rejected").length;
        const deletedDeviceCount = associatedDevices.length - failedDeviceDeletionCount;

        if (failedDeviceDeletionCount > 0) {
          setToast({
            type: TOAST_TYPE.WARNING,
            title: "Application removed.",
            message:
              failedDeviceDeletionCount === associatedDevices.length
                ? "The stream name was deleted, but its associated devices could not be removed."
                : `The stream name was deleted, ${deletedDeviceCount} associated ${
                    deletedDeviceCount === 1 ? "device was" : "devices were"
                  } removed, and ${failedDeviceDeletionCount} ${failedDeviceDeletionCount === 1 ? "device" : "devices"} could not be deleted.`,
          });
        } else {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Application removed.",
            message:
              associatedDevices.length > 0
                ? `${associatedDevices.length} associated ${
                    associatedDevices.length === 1 ? "device was" : "devices were"
                  } also deleted.`
                : undefined,
          });
        }

        await loadApplications();
      } catch (err) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: getErrorMessage(err, "Unable to remove application."),
        });
      } finally {
        setIsMutating(false);
      }
    },
    [loadApplications, resolveCpServerBaseUrl]
  );

  const ensureVirtualHostLoaded = useCallback(() => {
    if (hasLoadedVirtualHost || isVirtualHostLoading) return;
    void loadVirtualHostData();
  }, [hasLoadedVirtualHost, isVirtualHostLoading, loadVirtualHostData]);

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
            isLoading={isApplicationsLoading}
            isMutating={isMutating}
            onOpenCreateModal={openCreateModal}
            onDeleteApplication={(applicationName) => {
              openDeleteModal(applicationName);
            }}
          />

          <CollapsibleConfigurationCard
            title="Server Configuration"
            isOpen={isServerConfigOpen}
            onToggle={() => {
              const nextState = !isServerConfigOpen;
              setIsServerConfigOpen(nextState);
              if (nextState) ensureVirtualHostLoaded();
            }}
          >
            {isVirtualHostLoading ? (
              <p className="text-sm text-custom-text-300">Loading server configuration...</p>
            ) : virtualHostError ? (
              <p className="text-sm text-red-500">{virtualHostError}</p>
            ) : (
              <ServerConfigurationContent hostName={virtualHost.hostName} />
            )}
          </CollapsibleConfigurationCard>

          <CollapsibleConfigurationCard
            title="Virtual Host Configuration"
            isOpen={isVirtualHostOpen}
            onToggle={() => {
              const nextState = !isVirtualHostOpen;
              setIsVirtualHostOpen(nextState);
              if (nextState) ensureVirtualHostLoaded();
            }}
          >
            {isVirtualHostLoading ? (
              <p className="text-sm text-custom-text-300">Loading virtual host configuration...</p>
            ) : virtualHostError ? (
              <p className="text-sm text-red-500">{virtualHostError}</p>
            ) : (
              <VirtualHostConfigurationContent virtualHost={virtualHost} />
            )}
          </CollapsibleConfigurationCard>

          {applicationsError && <p className="text-sm text-red-500">{applicationsError}</p>}
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
            Are you sure you want to delete application{" "}
            <span className="font-medium text-custom-text-100">{applicationToDelete ?? "this application"}</span>? If
            you delete this application, its associated devices will also be deleted.
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
