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
import SAMLLogo from "@/app/assets/logos/saml-logo.svg?url";
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
import { SAML_FORM_FIELDS } from "./form-fields";
import { SAMLSetupModal } from "./setup-modal";

type TSAMLRoot = {
  workspaceSlug: string;
};

type TSAMLFormData = {
  entity_id: string;
  sso_url: string;
  certificate: string;
  logout_url: string;
  is_enabled: boolean;
  disable_requested_authn_context: boolean;
};

export function SAMLRoot(props: TSAMLRoot) {
  const { workspaceSlug } = props;
  // state
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [switchAlertModalState, setSwitchAlertModalState] = useState<TSwitchAlertModalState | undefined>(undefined);
  const [submitType, setSubmitType] = useState<"configure-and-enable" | "default" | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // SWR hooks
  const { hasAnyVerifiedDomain } = useDomains(workspaceSlug);
  const { isLoading: isProvidersLoading, samlProvider, activeProvider } = useProviders(workspaceSlug);
  const { createProvider, updateProvider } = useProviderActions(workspaceSlug);
  // derived values
  const isInitializing = isProvidersLoading;
  const isSwitchAlertRequired = useMemo(() => {
    return activeProvider && samlProvider && activeProvider.provider !== samlProvider.provider;
  }, [activeProvider, samlProvider]);
  const defaultValues = useMemo(
    () => ({
      entity_id: samlProvider?.entity_id || "",
      sso_url: samlProvider?.sso_url || "",
      certificate: samlProvider?.certificate || "",
      logout_url: samlProvider?.logout_url || "",
      is_enabled: samlProvider?.is_enabled ?? false,
      disable_requested_authn_context: samlProvider?.disable_requested_authn_context ?? true,
    }),
    [samlProvider]
  );
  // form info
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<TSAMLFormData>({
    defaultValues,
  });
  const isEnabled = useWatch({ control, name: "is_enabled" });
  // form derived values
  const isSubmitButtonDisabled = (!isDirty && !!samlProvider) || isInitializing || !hasAnyVerifiedDomain;

  // Reset form when provider changes
  useEffect(() => {
    if (samlProvider) {
      reset(defaultValues);
    }
  }, [defaultValues, samlProvider, reset]);

  const handleProviderCreateOrUpdate = useCallback(
    async (payload: TSAMLFormData, enableProvider: boolean) => {
      try {
        setSubmitType(enableProvider ? "configure-and-enable" : "default");
        if (samlProvider && samlProvider.id) {
          await updateProvider(samlProvider.id, payload);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("sso.providers.saml.configure.toast.success_title"),
            message: t("sso.providers.saml.configure.toast.update_success_message"),
          });
        } else {
          await createProvider({ ...payload, provider: "saml" });
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("sso.providers.saml.configure.toast.success_title"),
            message: t("sso.providers.saml.configure.toast.create_success_message"),
          });
        }
        reset(payload);
        setSubmitType(null);
      } catch (error) {
        console.error("Failed to save SAML provider", error);
        let errorMessage = t("sso.providers.saml.configure.toast.error_message");
        if (isSSOError(error)) {
          const message = SSO_ERROR_MESSAGES[error.response.data.error_code];
          errorMessage = message;
        }
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("sso.providers.saml.configure.toast.error_title"),
          message: errorMessage,
        });
        setSubmitType(null);
      }
    },
    [createProvider, updateProvider, samlProvider, reset, t]
  );

  const onSubmit = useCallback(
    async (data: TSAMLFormData, enableProvider: boolean) => {
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
      {isSwitchAlertRequired && samlProvider && activeProvider && switchAlertModalState && (
        <SwitchAlertModal
          activeProvider={activeProvider.provider}
          handleClose={() => setSwitchAlertModalState(undefined)}
          handleSwitch={async () => await switchAlertModalState.onSubmitCallback()}
          isOpen={switchAlertModalState.isOpen}
          newProvider={samlProvider.provider}
        />
      )}
      {isSetupModalOpen && <SAMLSetupModal isOpen={isSetupModalOpen} onClose={() => setIsSetupModalOpen(false)} />}
      <form className="w-full flex flex-col gap-8">
        {/* Provider header */}
        <ProviderHeader
          logo={SAMLLogo}
          logoAlt="SAML Logo"
          title={t("sso.providers.saml.configure.title")}
          description={t("sso.providers.saml.configure.description")}
          action={
            <Controller
              control={control}
              name="is_enabled"
              render={({ field: { value, onChange } }) => <Switch value={value} onChange={onChange} />}
            />
          }
          logoClassName="pl-0.5"
        />
        {/* Service details section */}
        <ProviderSetupDetailsSection workspaceSlug={workspaceSlug} onOpenModal={() => setIsSetupModalOpen(true)} />
        {/* Form section */}
        <ProviderFormSection workspaceSlug={workspaceSlug}>
          <div className="flex flex-col gap-6">
            {SAML_FORM_FIELDS.map((field) => {
              const error = errors[field.name];
              const errorMessage = error?.message;

              return (
                <ProviderFormField<TSAMLFormData>
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
