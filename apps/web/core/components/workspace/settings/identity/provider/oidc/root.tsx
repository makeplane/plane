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

import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
// plane imports
import { SSO_ERROR_MESSAGES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { isSSOError } from "@plane/services";
import { Switch } from "@plane/propel/switch";
// assets
import OIDCLogo from "@/app/assets/logos/oidc-logo.svg?url";
// hooks
import { useDomains } from "@/plane-web/hooks/sso/use-domains";
import { useProviders } from "@/plane-web/hooks/sso/use-providers";
import { useProviderActions } from "@/plane-web/hooks/sso/use-provider-actions";
// local imports
import { ProviderFormSection } from "../common/form-section";
import { ProviderHeader } from "../common/header";
import { ProviderSetupDetailsSection } from "../common/setup-details-section";
import { SwitchAlertModal } from "../common/switch-alert-modal";
import type { TSwitchAlertModalState } from "../common/switch-alert-modal";
import { ProviderFormField } from "../common/provider-form-field";
import { ProviderFormActionButtons } from "../common/form-action-buttons";
import { OIDC_FORM_FIELDS } from "./form-fields";
import { OIDCSetupModal } from "./setup-modal";

type TOIDCRoot = {
  workspaceSlug: string;
};

type TOIDCFormData = {
  client_id: string;
  client_secret: string;
  authorize_url: string;
  token_url: string;
  userinfo_url: string;
  logout_url: string;
  is_enabled: boolean;
};

export function OIDCRoot(props: TOIDCRoot) {
  const { workspaceSlug } = props;
  // state
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [switchAlertModalState, setSwitchAlertModalState] = useState<TSwitchAlertModalState | undefined>(undefined);
  const [submitType, setSubmitType] = useState<"configure-and-enable" | "default" | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // SWR hooks
  const { hasAnyVerifiedDomain } = useDomains(workspaceSlug);
  const { isLoading: isProvidersLoading, oidcProvider, activeProvider } = useProviders(workspaceSlug);
  const { createProvider, updateProvider } = useProviderActions(workspaceSlug);
  // derived values
  const isInitializing = isProvidersLoading;
  const isSwitchAlertRequired = useMemo(() => {
    return activeProvider && oidcProvider && activeProvider.provider !== oidcProvider.provider;
  }, [activeProvider, oidcProvider]);
  const defaultValues = useMemo(
    () => ({
      client_id: oidcProvider?.client_id || "",
      client_secret: oidcProvider?.client_secret || "",
      authorize_url: oidcProvider?.authorize_url || "",
      token_url: oidcProvider?.token_url || "",
      userinfo_url: oidcProvider?.userinfo_url || "",
      logout_url: oidcProvider?.logout_url || "",
      is_enabled: oidcProvider?.is_enabled ?? false,
    }),
    [oidcProvider]
  );
  // form info
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<TOIDCFormData>({
    defaultValues,
  });
  const isEnabled = useWatch({ control, name: "is_enabled" });
  // form derived values
  const isSubmitButtonDisabled = (!isDirty && !!oidcProvider) || isInitializing || !hasAnyVerifiedDomain;

  // Reset form when provider changes
  useEffect(() => {
    if (oidcProvider) {
      reset(defaultValues);
    }
  }, [defaultValues, oidcProvider, reset]);

  const handleProviderCreateOrUpdate = useCallback(
    async (payload: TOIDCFormData, enableProvider: boolean) => {
      try {
        setSubmitType(enableProvider ? "configure-and-enable" : "default");
        if (oidcProvider && oidcProvider.id) {
          await updateProvider(oidcProvider.id, payload);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("sso.providers.oidc.configure.toast.success_title"),
            message: t("sso.providers.oidc.configure.toast.update_success_message"),
          });
        } else {
          await createProvider({ ...payload, provider: "oidc" });
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("sso.providers.oidc.configure.toast.success_title"),
            message: t("sso.providers.oidc.configure.toast.create_success_message"),
          });
        }
        reset(payload);
        setSubmitType(null);
      } catch (error) {
        console.error("Failed to save OIDC provider", error);
        let errorMessage = t("sso.providers.oidc.configure.toast.error_message");
        if (isSSOError(error)) {
          const message = SSO_ERROR_MESSAGES[error.response.data.error_code];
          errorMessage = message;
        }
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("sso.providers.oidc.configure.toast.error_title"),
          message: errorMessage,
        });
        setSubmitType(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [createProvider, updateProvider, oidcProvider, reset]
  );

  const onSubmit = useCallback(
    async (data: TOIDCFormData, enableProvider: boolean) => {
      const payload = {
        ...data,
        is_enabled: enableProvider ? true : data.is_enabled,
      };
      if (payload.is_enabled && isSwitchAlertRequired) {
        setSwitchAlertModalState({
          isOpen: true,
          onSubmitCallback: async () => await handleProviderCreateOrUpdate(payload, enableProvider),
        });
      } else {
        await handleProviderCreateOrUpdate(payload, enableProvider);
      }
    },
    [handleProviderCreateOrUpdate, isSwitchAlertRequired]
  );

  return (
    <>
      {isSwitchAlertRequired && oidcProvider && activeProvider && switchAlertModalState && (
        <SwitchAlertModal
          activeProvider={activeProvider.provider}
          handleClose={() => setSwitchAlertModalState(undefined)}
          handleSwitch={async () => await switchAlertModalState.onSubmitCallback()}
          isOpen={switchAlertModalState.isOpen}
          newProvider={oidcProvider.provider}
        />
      )}
      {isSetupModalOpen && <OIDCSetupModal isOpen={isSetupModalOpen} onClose={() => setIsSetupModalOpen(false)} />}
      <form className="w-full flex flex-col gap-8">
        {/* Provider header */}
        <ProviderHeader
          logo={OIDCLogo}
          logoAlt="OIDC Logo"
          title={t("sso.providers.oidc.configure.title")}
          description={t("sso.providers.oidc.configure.description")}
          action={
            <Controller
              control={control}
              name="is_enabled"
              render={({ field: { value, onChange } }) => <Switch value={value} onChange={onChange} />}
            />
          }
        />
        {/* Service details section */}
        <ProviderSetupDetailsSection workspaceSlug={workspaceSlug} onOpenModal={() => setIsSetupModalOpen(true)} />
        {/* Form section */}
        <ProviderFormSection workspaceSlug={workspaceSlug}>
          <div className="flex flex-col gap-6">
            {OIDC_FORM_FIELDS.map((field) => {
              const error = errors[field.name];
              const errorMessage = error?.message;
              return (
                <ProviderFormField<TOIDCFormData>
                  key={field.name}
                  {...field}
                  control={control}
                  errorMessage={typeof errorMessage === "string" ? errorMessage : undefined}
                  isInitializing={isInitializing}
                />
              );
            })}
          </div>
          <ProviderFormActionButtons
            isEnabled={isEnabled}
            isSubmitButtonDisabled={isSubmitButtonDisabled}
            isSubmitting={isSubmitting}
            onSubmit={async (enableProvider: boolean) => await handleSubmit((data) => onSubmit(data, enableProvider))()}
            submitType={submitType}
            t={t}
            tooltipContentI18nKey={hasAnyVerifiedDomain ? undefined : "sso.providers.disabled_message"}
          />
        </ProviderFormSection>
      </form>
    </>
  );
}
