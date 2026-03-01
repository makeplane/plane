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
import ClickUpLogo from "@/app/assets/services/clickup.svg?url";
// plane web hooks
import { useClickUpImporter } from "@/plane-web/hooks/store";
// plane web components
import type { TAuthFormInputFormField } from "@/components/importers/ui/auth-form-input";
import { AuthFormInput } from "@/components/importers/ui/auth-form-input";
// plane web types
import type { TImporterPATError } from "@/types";
import type { TClickUpPATFormFields } from "@/types/importers/clickup";
import ImporterHeader from "../../header";
import ErrorBanner from "../../ui/error-banner";

export const PersonalAccessTokenAuth = observer(function PersonalAccessTokenAuth() {
  // hooks
  const {
    auth: { authWithPAT },
  } = useClickUpImporter();
  const { t } = useTranslation();

  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<TClickUpPATFormFields>({
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
  const handleFormData = <T extends keyof TClickUpPATFormFields>(key: T, value: TClickUpPATFormFields[T]) => {
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
    } catch (error) {
      const { message } = error as { message: string };
      updatePATError(message || "Something went wrong while authorizing ClickUp");
      togglePATError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // CLICKUP PAT form fields
  const clickUpPatFormFields: TAuthFormInputFormField[] = [
    {
      key: "CLICKUP_PAT",
      type: "password",
      label: "Personal Access Token",
      value: formData.personalAccessToken,
      onChange: (e) => handleFormData("personalAccessToken", e.target.value),
      description: (
        <>
          {t("importers.token_helper")}{" "}
          <a
            tabIndex={-1}
            href="http://help.clickup.com/hc/en-us/articles/6303426241687-Use-the-ClickUp-API#personal-api-key"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
          >
            ClickUp App Settings.
          </a>
        </>
      ),
      placeholder: "pk_54375*******************************YXDU",
      error: false,
    },
  ];

  return (
    <div className="space-y-6">
      <ImporterHeader
        config={{
          serviceName: `ClickUp to Plane ${t("importers.migration_assistant")}`,
          logo: ClickUpLogo,
        }}
        description={t("importers.migration_assistant_description", { serviceName: "ClickUp" })}
      />
      <div className="space-y-6">
        {patError.showPATError && (
          <ErrorBanner
            message={t("importers.invalid_pat")}
            onClose={() => {
              togglePATError(false);
            }}
          />
        )}
        {clickUpPatFormFields.map((field) => (
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
        <div className="relative flex justify-end gap-4">
          <Button variant="ghost" className="font-medium" onClick={clearFromData} disabled={isLoading}>
            {t("common.clear")}
          </Button>
          <Button variant="primary" onClick={handlePATAuthentication} disabled={isLoading}>
            {isLoading ? t("common.authorizing") : t("importers.connect_importer", { serviceName: "ClickUp" })}
          </Button>
        </div>
      </div>
    </div>
  );
});
