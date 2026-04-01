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
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Switch } from "@plane/propel/switch";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Loader } from "@plane/ui";
import { useWorkspace } from "@/hooks/store/use-workspace";
import OAuthBridgeLogo from "@/app/assets/logos/integrations/oauth-bridge.svg?url";
import { ApplicationService } from "@/services/marketplace/application.service";
import { OAuthBridgeService } from "@/services/integrations/oauth-bridge.service";
import type {
  IExternalTokenProvider,
  IExternalTokenProviderPayload,
} from "@/services/integrations/oauth-bridge.service";
import { ProviderModal } from "./provider-modal";

const applicationService = new ApplicationService();
const oauthBridgeService = new OAuthBridgeService();

const APP_SLUG = "oauth-bridge";

export const OAuthBridgeIntegrationRoot = observer(function OAuthBridgeIntegrationRoot() {
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const workspaceSlug = currentWorkspace?.slug;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<IExternalTokenProvider | null>(null);
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const {
    data: appData,
    isLoading: isAppLoading,
    mutate: mutateApp,
  } = useSWR(
    workspaceSlug ? `OAUTH_BRIDGE_APP_${workspaceSlug}` : null,
    workspaceSlug ? () => applicationService.getApplication(workspaceSlug, APP_SLUG) : null,
    { revalidateOnFocus: false, errorRetryCount: 0 }
  );

  const isInstalled = !!appData?.is_installed;

  const {
    data: providers,
    isLoading: isProvidersLoading,
    mutate: mutateProviders,
  } = useSWR(
    workspaceSlug && isInstalled ? `OAUTH_BRIDGE_PROVIDERS_${workspaceSlug}` : null,
    workspaceSlug && isInstalled ? () => oauthBridgeService.listProviders(workspaceSlug) : null,
    { revalidateOnFocus: false, errorRetryCount: 0 }
  );

  const handleInstall = async () => {
    if (!workspaceSlug || !appData?.id) return;
    try {
      await applicationService.installApplication(workspaceSlug, appData.id);
      await mutateApp();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("oauth_bridge_integration.install_success"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t("oauth_bridge_integration.install_error") });
    }
  };

  const handleUninstall = async () => {
    if (!workspaceSlug || !appData?.installation_id) return;
    setIsUninstalling(true);
    try {
      await applicationService.revokeApplicationAccess(workspaceSlug, appData.installation_id);
      await mutateApp();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("oauth_bridge_integration.uninstall_success"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t("oauth_bridge_integration.uninstall_error") });
    } finally {
      setIsUninstalling(false);
    }
  };

  const handleSave = async (data: IExternalTokenProviderPayload) => {
    if (!workspaceSlug) return;
    try {
      if (editProvider) {
        await oauthBridgeService.updateProvider(workspaceSlug, editProvider.id, data);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("success"),
          message: t("oauth_bridge_integration.provider_updated"),
        });
      } else {
        await oauthBridgeService.createProvider(workspaceSlug, data);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("success"),
          message: t("oauth_bridge_integration.provider_added"),
        });
      }
      await mutateProviders();
    } catch (error) {
      const message =
        typeof error === "string"
          ? error
          : (error as Record<string, string>)?.detail || t("oauth_bridge_integration.provider_save_error");
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message });
      throw error;
    }
  };

  const handleDelete = async (provider: IExternalTokenProvider) => {
    if (!workspaceSlug) return;
    setDeletingId(provider.id);
    try {
      await oauthBridgeService.deleteProvider(workspaceSlug, provider.id);
      await mutateProviders();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("oauth_bridge_integration.provider_deleted"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("oauth_bridge_integration.provider_delete_error"),
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleEnabled = async (provider: IExternalTokenProvider) => {
    if (!workspaceSlug) return;
    setTogglingId(provider.id);
    try {
      await oauthBridgeService.updateProvider(workspaceSlug, provider.id, { is_enabled: !provider.is_enabled });
      await mutateProviders();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("oauth_bridge_integration.provider_update_error"),
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleTest = async (provider: IExternalTokenProvider) => {
    if (!workspaceSlug) return;
    setTestingId(provider.id);
    try {
      const result = await oauthBridgeService.testProvider(workspaceSlug, provider.id);
      if (result.success) {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("oauth_bridge_integration.jwks_reachable"),
          message: result.message,
        });
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("oauth_bridge_integration.jwks_unreachable"),
          message: result.message,
        });
      }
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("oauth_bridge_integration.jwks_unreachable"),
        message: t("oauth_bridge_integration.jwks_test_error"),
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleOpenCreate = () => {
    setEditProvider(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (provider: IExternalTokenProvider) => {
    setEditProvider(provider);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditProvider(null);
  };

  return (
    <>
      {/* Header card */}
      <div className="flex-shrink-0 relative flex items-center gap-4 p-4 bg-layer-1 rounded-lg">
        <div className="flex-shrink-0 size-10 relative flex justify-center items-center overflow-hidden">
          <img src={OAuthBridgeLogo} alt="OAuth Bridge Logo" className="w-full h-full object-cover" />
        </div>
        <div className="w-full h-full overflow-hidden">
          <div className="text-body-sm-medium">{t("oauth_bridge_integration.name")}</div>
          <div className="text-body-xs-regular text-secondary">{t("oauth_bridge_integration.header_description")}</div>
        </div>
        <div className="flex-shrink-0 relative flex items-center gap-3">
          {isAppLoading ? (
            <Loader className="flex items-center justify-center">
              <Loader.Item width="70px" height="30px" />
            </Loader>
          ) : isInstalled ? (
            <>
              <div className="text-body-xs-regular bg-success-subtle text-success-primary px-3 py-1 rounded-md">
                {t("oauth_bridge_integration.connected")}
              </div>
              <Button variant="error-outline" size="base" onClick={handleUninstall} loading={isUninstalling}>
                {isUninstalling ? t("oauth_bridge_integration.uninstalling") : t("oauth_bridge_integration.uninstall")}
              </Button>
            </>
          ) : (
            <Button onClick={handleInstall}>{t("oauth_bridge_integration.connect")}</Button>
          )}
        </div>
      </div>

      {/* Token Providers — only when installed */}
      {isInstalled && (
        <div className="flex-shrink-0 relative flex flex-col border-t border-subtle py-4 px-2">
          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-body-sm-medium">{t("oauth_bridge_integration.token_providers")}</div>
              <div className="text-body-xs-regular text-secondary mt-0.5">
                {t("oauth_bridge_integration.token_providers_description")}
              </div>
            </div>
            <Button variant="ghost" size="base" onClick={handleOpenCreate}>
              <Plus className="size-3.5" />
              {t("oauth_bridge_integration.add_provider")}
            </Button>
          </div>

          {/* Provider list */}
          {isProvidersLoading ? (
            <div className="space-y-3">
              <Loader>
                <Loader.Item height="60px" width="100%" />
              </Loader>
            </div>
          ) : providers && providers.length > 0 ? (
            <div className="flex flex-col gap-3">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="flex-shrink-0 relative flex items-center gap-4 p-4 border border-subtle rounded-lg"
                >
                  <div className="w-full h-full overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-body-xs-medium">{provider.name}</span>
                      <span
                        className={`shrink-0 text-body-xs-regular px-2 py-0.5 rounded-md ${
                          provider.is_enabled ? "bg-success-subtle text-success-primary" : "bg-layer-2 text-tertiary"
                        }`}
                      >
                        {provider.is_enabled
                          ? t("oauth_bridge_integration.enabled")
                          : t("oauth_bridge_integration.disabled")}
                      </span>
                    </div>
                    <div className="text-body-xs-regular text-secondary truncate mt-0.5">{provider.issuer}</div>
                  </div>
                  <div className="flex-shrink-0 relative flex items-center gap-2">
                    <Switch
                      value={provider.is_enabled}
                      onChange={() => void handleToggleEnabled(provider)}
                      disabled={togglingId === provider.id}
                      size="sm"
                      label={
                        provider.is_enabled
                          ? t("oauth_bridge_integration.enabled")
                          : t("oauth_bridge_integration.disabled")
                      }
                    />
                    <Button
                      variant="ghost"
                      size="base"
                      onClick={() => void handleTest(provider)}
                      loading={testingId === provider.id}
                      disabled={testingId === provider.id}
                    >
                      {t("oauth_bridge_integration.test")}
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(provider)}
                      className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-layer-2 transition-colors"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(provider)}
                      disabled={deletingId === provider.id}
                      className="p-1.5 rounded text-tertiary hover:text-danger-primary hover:bg-layer-2 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-body-sm-medium text-secondary">{t("oauth_bridge_integration.no_providers_title")}</p>
              <p className="text-body-xs-regular text-tertiary mt-1">
                {t("oauth_bridge_integration.no_providers_description")}
              </p>
            </div>
          )}
        </div>
      )}

      <ProviderModal isOpen={isModalOpen} onClose={handleCloseModal} editProvider={editProvider} onSave={handleSave} />
    </>
  );
});
