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
import { useForm, Controller } from "react-hook-form";
// plane imports
import { SSO_ERROR_MESSAGES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Input } from "@plane/propel/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { isSSOError } from "@plane/services";
import type { TDomain } from "@plane/types";
// hooks
import { useDomainActions } from "@/plane-web/hooks/sso/use-domain-actions";
// local components
import { ModalFormFooter } from "./modal-form-footer";
import { ModalFormHeader } from "./modal-form-header";

type TAddDomainForm = {
  onClose: () => void;
  onSuccess: (domain: TDomain) => void;
  workspaceSlug: string;
};

type TFormData = {
  domain: string;
};

export function AddDomainForm(props: TAddDomainForm) {
  const { workspaceSlug, onClose, onSuccess } = props;
  // state
  const [apiError, setApiError] = useState<string>("");
  // plane hooks
  const { t } = useTranslation();
  // SWR hooks
  const { createDomain, isCreating } = useDomainActions(workspaceSlug);
  // form info
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TFormData>({
    defaultValues: {
      domain: "",
    },
  });

  const onSubmit = async (data: TFormData) => {
    // Clear previous API errors
    setApiError("");
    try {
      // Create the domain
      const domain = await createDomain({ domain: data.domain });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("sso.domain_management.verified_domains.add_domain.toast.success_title"),
        message: t("sso.domain_management.verified_domains.add_domain.toast.success_message"),
      });
      onSuccess(domain);
    } catch (error) {
      console.error("Failed to create domain", error);
      let errorMessage = t("sso.domain_management.verified_domains.add_domain.toast.error_message");
      if (isSSOError(error)) {
        const message = SSO_ERROR_MESSAGES[error.response.data.error_code];
        errorMessage = message;
      }
      setApiError(errorMessage);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e);
      }}
      className="flex flex-col p-4"
    >
      <ModalFormHeader
        title={t("sso.domain_management.verified_domains.add_domain.title")}
        description={t("sso.domain_management.verified_domains.add_domain.description")}
      />
      <div className="space-y-4 py-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="domain" className="text-body-sm-medium text-primary">
            {t("sso.domain_management.verified_domains.add_domain.form.domain_label")}{" "}
            <span className="text-danger-secondary">*</span>
          </label>
          <Controller
            name="domain"
            control={control}
            rules={{
              required: t("sso.domain_management.verified_domains.add_domain.form.domain_required"),
              pattern: {
                value:
                  /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/,
                message: t("sso.domain_management.verified_domains.add_domain.form.domain_invalid"),
              },
            }}
            render={({ field }) => (
              <Input
                {...field}
                id="domain"
                type="text"
                placeholder={t("sso.domain_management.verified_domains.add_domain.form.domain_placeholder")}
                autoComplete="off"
                className="w-full"
                hasError={!!(errors.domain || apiError)}
              />
            )}
          />
          {errors.domain && <p className="text-caption-xs-medium text-danger-secondary">{errors.domain.message}</p>}
          {apiError && !errors.domain && <p className="text-caption-xs-medium text-danger-secondary">{apiError}</p>}
        </div>
      </div>
      <ModalFormFooter
        primaryButtonText={t("sso.domain_management.verified_domains.add_domain.primary_button_text")}
        primaryButtonLoadingText={t("sso.domain_management.verified_domains.add_domain.primary_button_loading_text")}
        onPrimaryClick={() => {}}
        onSecondaryClick={onClose}
        isLoading={isSubmitting || isCreating}
        primaryButtonType="submit"
      />
    </form>
  );
}
