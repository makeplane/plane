"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { AlertModalCore } from "@plane/ui";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import { DeviceFormModal } from "./components/device-form-modal";
import { DevicesGrid } from "./components/devices-grid";
import { createDevice, deleteDevice, fetchDeviceFormOptions, fetchDevices, updateDevice } from "./devices.api";
import { DEVICE_FORM_DEFAULT_VALUES } from "./devices.types";
import type { TDevice, TDeviceFormMode, TDeviceFormOptions, TDeviceFormValues } from "./devices.types";
import { getCpServerBaseUrl, getErrorMessage } from "./devices.utils";

const EMPTY_DEVICE_OPTIONS: TDeviceFormOptions = {
  applications: [],
  deviceTypes: [],
  users: [],
};
const SERVICE_GATEWAY_USER_LABEL = "service gateway";

const getServiceGatewayUserId = (users: TDeviceFormOptions["users"]) =>
  users.find((user) => user.label.trim().toLowerCase() === SERVICE_GATEWAY_USER_LABEL)?.id ?? null;

const mergeApplicationOptions = (applications: string[], devices: TDevice[]) =>
  Array.from(
    new Set([
      ...applications,
      ...devices.map((device) => device.appName.trim()).filter((appName) => appName.length > 0),
    ])
  ).sort((a, b) => a.localeCompare(b));

const WorkspaceDevicesSettingsPage = observer(() => {
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  // const searchParams = useSearchParams();

  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Devices` : undefined;
  // const forceSkeleton = searchParams.get("skeleton") === "1";

  const cpServerBaseUrl = useMemo(() => getCpServerBaseUrl(), []);

  const [devices, setDevices] = useState<TDevice[]>([]);
  const [formOptions, setFormOptions] = useState<TDeviceFormOptions>(EMPTY_DEVICE_OPTIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOptionsLoading, setIsFormOptionsLoading] = useState(false);
  const [hasLoadedFormOptions, setHasLoadedFormOptions] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedDeviceId, setCopiedDeviceId] = useState<number | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<TDeviceFormMode>("create");
  const [formInitialValues, setFormInitialValues] = useState<TDeviceFormValues>(DEVICE_FORM_DEFAULT_VALUES);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<TDevice | null>(null);
  const defaultServiceGatewayUserId = useMemo(() => getServiceGatewayUserId(formOptions.users), [formOptions.users]);

  const resolveCpServerBaseUrl = useCallback(() => {
    if (cpServerBaseUrl) return cpServerBaseUrl;

    setToast({
      type: TOAST_TYPE.ERROR,
      title: "NEXT_PUBLIC_CP_SERVER_URL is not configured.",
    });

    return null;
  }, [cpServerBaseUrl]);

  const loadDevices = useCallback(async (): Promise<TDevice[]> => {
    const baseUrl = resolveCpServerBaseUrl();
    if (!baseUrl) {
      setError("NEXT_PUBLIC_CP_SERVER_URL is not configured.");
      setIsLoading(false);
      return [];
    }

    setIsLoading(true);

    try {
      const data = await fetchDevices(baseUrl);
      setDevices(data);
      setError(null);
      return data;
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load devices."));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [resolveCpServerBaseUrl]);

  const ensureFormOptionsLoaded = useCallback(async () => {
    if (hasLoadedFormOptions) return true;
    if (isFormOptionsLoading) return false;

    const baseUrl = resolveCpServerBaseUrl();
    if (!baseUrl) {
      return false;
    }

    setIsFormOptionsLoading(true);

    try {
      const options = await fetchDeviceFormOptions(baseUrl);
      setFormOptions(options);
      setHasLoadedFormOptions(true);
      return true;
    } catch (err) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: getErrorMessage(err, "Unable to load device form options."),
      });
      return false;
    } finally {
      setIsFormOptionsLoading(false);
    }
  }, [hasLoadedFormOptions, isFormOptionsLoading, resolveCpServerBaseUrl]);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  const openCreateModal = async () => {
    if (!(await ensureFormOptionsLoaded())) return;

    setFormMode("create");
    setFormInitialValues({
      ...DEVICE_FORM_DEFAULT_VALUES,
      userId: defaultServiceGatewayUserId,
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = async (device: TDevice) => {
    if (!(await ensureFormOptionsLoaded())) return;

    setFormMode("edit");
    setFormInitialValues({
      id: device.id,
      appName: device.appName,
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      userId: device.userId ?? defaultServiceGatewayUserId,
      deviceCode: device.deviceCode,
      pin: device.pin,
    });
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
  };

  const handleFormSubmit = async (values: TDeviceFormValues) => {
    const baseUrl = resolveCpServerBaseUrl();
    if (!baseUrl) return;

    setIsMutating(true);

    try {
      if (formMode === "edit") {
        await updateDevice(baseUrl, values);
      } else {
        await createDevice(baseUrl, values);
      }

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: formMode === "edit" ? "Device updated." : "Device created.",
      });

      closeFormModal();
      const refreshedDevices = await loadDevices();

      if (formMode === "edit" && values.id) {
        const refreshedDevice = refreshedDevices.find((device) => device.id === values.id);
        const submittedAppName = values.appName.trim();

        if (refreshedDevice && refreshedDevice.appName.trim() !== submittedAppName) {
          setToast({
            type: TOAST_TYPE.WARNING,
            title: "The CP server is still returning a different app name.",
            message: `Saved "${submittedAppName}", but the latest device payload still reports "${refreshedDevice.appName}".`,
          });
        }
      }
    } catch (err) {
      if (formMode === "edit") {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: getErrorMessage(err, "Unable to update device."),
        });
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Device is not registered.",
          message: getErrorMessage(err, "Unable to register device."),
        });
      }
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteDevice = async (device: TDevice) => {
    const baseUrl = resolveCpServerBaseUrl();
    if (!baseUrl) return;

    setIsMutating(true);

    try {
      await deleteDevice(baseUrl, device.id);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Device deleted.",
      });

      await loadDevices();
    } catch (err) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: getErrorMessage(err, "Unable to delete device."),
      });
    } finally {
      setIsMutating(false);
    }
  };

  const openDeleteModal = (device: TDevice) => {
    setDeviceToDelete(device);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeviceToDelete(null);
  };

  const handleConfirmDeleteDevice = async () => {
    if (!deviceToDelete) return;
    await handleDeleteDevice(deviceToDelete);
    closeDeleteModal();
  };

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  const handleCopyUrl = async (device: TDevice) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(device.streamingUrl);
      } else {
        fallbackCopy(device.streamingUrl);
      }

      setCopiedDeviceId(device.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "URL copied.",
      });

      window.setTimeout(() => {
        setCopiedDeviceId((current) => (current === device.id ? null : current));
      }, 3000);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Failed to copy URL.",
      });
    }
  };

  const formOptionsWithDeviceApps = useMemo(
    () => ({
      ...formOptions,
      applications: mergeApplicationOptions(formOptions.applications, devices),
    }),
    [devices, formOptions]
  );

  if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper size="lg">
      <PageHead title={pageTitle} />
      <div className="w-full">
        <SettingsHeading
          title="Devices"
          description="Manage workspace-level devices access and configuration from this tab."
          customButton={
            <Button
              variant="primary"
              size="sm"
              prependIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                void openCreateModal();
              }}
              disabled={isFormOptionsLoading || isMutating}
            >
              Register Device
            </Button>
          }
        />

        <div className="mt-6 space-y-4">
          <DevicesGrid
            devices={devices}
            copiedDeviceId={copiedDeviceId}
            isLoading={isLoading}
            isMutating={isMutating || isFormOptionsLoading}
            onCopyUrl={(device) => {
              void handleCopyUrl(device);
            }}
            onEdit={(device) => {
              void openEditModal(device);
            }}
            onDelete={(device) => {
              openDeleteModal(device);
            }}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>

      <AlertModalCore
        handleClose={closeDeleteModal}
        handleSubmit={() => {
          void handleConfirmDeleteDevice();
        }}
        isSubmitting={isMutating}
        isOpen={isDeleteModalOpen}
        title="Delete device"
        content={
          <>
            Are you sure you want to delete{" "}
            <span className="font-medium text-custom-text-100">{deviceToDelete?.deviceName ?? "this device"}</span>?
            This action cannot be undone.
          </>
        }
      />

      <DeviceFormModal
        isOpen={isFormModalOpen}
        mode={formMode}
        isSubmitting={isMutating}
        initialValues={formInitialValues}
        options={formOptionsWithDeviceApps}
        onClose={closeFormModal}
        onSubmit={(values) => {
          void handleFormSubmit(values);
        }}
      />
    </SettingsContentWrapper>
  );
});

export default WorkspaceDevicesSettingsPage;
