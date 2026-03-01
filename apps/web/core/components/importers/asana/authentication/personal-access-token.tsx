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
import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// assets
import AsanaLogo from "@/app/assets/services/asana.svg?url";
// plane web hooks
import { useAsanaImporter } from "@/plane-web/hooks/store";
// plane web components
import type { TAuthFormInputFormField } from "@/components/importers/ui/auth-form-input";
import { AuthFormInput } from "@/components/importers/ui/auth-form-input";
// plane web types
import type { TImporterPATError } from "@/types";
import type { TAsanaPATFormFields } from "@/types/importers/asana";
import ImporterHeader from "../../header";
import ErrorBanner from "../../ui/error-banner";

export const PersonalAccessTokenAuth = observer(function PersonalAccessTokenAuth() {
  // hooks
  const {
    auth: { authWithPAT },
  } = useAsanaImporter();
  const { t } = useTranslation();
  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<TAsanaPATFormFields>({
    personalAccessToken: "",
  });
  const [patError, setPatError] = useState<TImporterPATError>({
    showPATError: false,
    message: "",
  });

  const togglePATError = (flag: boolean) => {
    setPatError((prev) => ({ ...prev, showPATError: flag }));
  };

  const updatePATError = (message: string) => {
    setPatError((prev) => ({ ...prev, message }));
  };

  // handlers
  const handleFormData = <T extends keyof TAsanaPATFormFields>(key: T, value: TAsanaPATFormFields[T]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };
  const clearFromData = () => {
    setFormData({
      personalAccessToken: "",
    });
  };

  const handlePATAuthentication = async () => {
    try {
      setIsLoading(true);
      await authWithPAT(formData);
    } catch (error: any) {
      const { message } = error as { message: string };
      updatePATError(message || "Something went wrong while authorizing Jira");
      togglePATError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // constants
  const asanaPatFormFields: TAuthFormInputFormField[] = [
    {
      key: "ASANA_PAT",
      type: "password",
      label: t("importers.personal_access_token"),
      value: formData.personalAccessToken,
      onChange: (e) => handleFormData("personalAccessToken", e.target.value),
      description: (
        <>
          {t("importers.token_helper")}{" "}
          <a
            tabIndex={-1}
            href="https://app.asana.com/0/my-apps"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
          >
            Asana Security Settings.
          </a>
        </>
      ),
      placeholder: "2/120823490290309127/12028932342561120:ac2829783JS07d72b0c5fc998af0a0",
      error: false,
    },
  ];

  return (
    <div className="space-y-6 w-full">
      <ImporterHeader
        config={{
          serviceName: "Asana",
          logo: AsanaLogo,
        }}
      />
      <div className="space-y-6 w-full">
        {patError.showPATError && (
          <ErrorBanner
            message={t("importers.invalid_pat")}
            onClose={() => {
              togglePATError(false);
            }}
          />
        )}
        <div className="grid grid-cols-1 gap-x-12 gap-y-8 w-full">
          {asanaPatFormFields.map((field) => (
            <AuthFormInput
              key={field.key}
              type={field.type}
              name={field.key}
              label={field.label}
              value={field.value}
              onChange={field.onChange}
              description={field.description}
              placeholder={field.placeholder}
              error={field.error}
            />
          ))}
        </div>
        <div className="relative flex justify-start gap-4">
          <Button variant="primary" onClick={handlePATAuthentication} loading={isLoading} disabled={isLoading}>
            {isLoading ? t("common.authorizing") : t("importers.connect_importer", { serviceName: "Asana" })}
          </Button>{" "}
          <Button variant="ghost" className="font-medium" onClick={clearFromData}>
            {t("common.clear")}
          </Button>
        </div>
      </div>
    </div>
  );
});
