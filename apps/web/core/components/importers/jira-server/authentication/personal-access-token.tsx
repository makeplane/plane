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
// plane imports
import { stripTrailingSlash } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// assets
import JiraLogo from "@/app/assets/services/jira.svg?url";
// plane web hooks
// plane web components
import type { TAuthFormInputFormField } from "@/components/importers/ui/auth-form-input";
import { AuthFormInput } from "@/components/importers/ui/auth-form-input";
// plane web hooks
import { useJiraServerImporter } from "@/plane-web/hooks/store";
// plane web types
import type { TImporterPATError } from "@/types";
import type { TJiraPATFormFields } from "@/types/importers/jira-server";
import ImporterHeader from "../../header";
import ErrorBanner from "../../ui/error-banner";

export const PersonalAccessTokenAuth = observer(function PersonalAccessTokenAuth() {
  // hooks
  const {
    auth: { authWithPAT },
  } = useJiraServerImporter();
  const { t } = useTranslation();

  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<TJiraPATFormFields>({
    personalAccessToken: "",
    userEmail: "",
    hostname: "",
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
  const handleFormData = <T extends keyof TJiraPATFormFields>(key: T, value: TJiraPATFormFields[T]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const clearFromData = () => {
    setFormData({
      personalAccessToken: "",
      userEmail: "",
      hostname: "",
    });
  };

  const handlePATAuthentication = async () => {
    try {
      setIsLoading(true);
      formData.hostname = stripTrailingSlash(formData.hostname);
      await authWithPAT(formData);
    } catch (error) {
      const { message } = error as { message: string };
      updatePATError(message || "Something went wrong while authorizing Jira");
      togglePATError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // JIRA PAT form fields
  const jiraPatFormFields: TAuthFormInputFormField[] = [
    {
      key: "JIRA_PAT",
      type: "password",
      label: t("importers.personal_access_token"),
      value: formData.personalAccessToken,
      onChange: (e) => handleFormData("personalAccessToken", e.target.value),
      description: (
        <>
          {t("importers.token_helper")}{" "}
          <a
            tabIndex={-1}
            href="https://id.atlassian.com/manage-profile/security/api-tokens"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
          >
            {t("jira_importer.atlassian_security_settings")}
          </a>
        </>
      ),
      placeholder: "ATATT9SDAKLFJ9SALJ",
      error: false,
    },
    {
      key: "JIRA_USER_EMAIL",
      type: "text",
      label: t("importers.user_email"),
      value: formData.userEmail,
      onChange: (e) => handleFormData("userEmail", e.target.value),
      description: "This is the email linked to your personal access token",
      placeholder: "john.doe@example.com",
      error: false,
    },
    {
      key: "JIRA_DOMAIN",
      type: "text",
      label: "Jira domain",
      value: formData.hostname,
      onChange: (e) => handleFormData("hostname", e.target.value),
      description: "This is the domain of your Jira instance",
      placeholder: "https://jira.example.com",
      error: false,
    },
  ];

  return (
    <div className="space-y-6 w-full">
      <ImporterHeader
        config={{
          serviceName: "Jira Server/Data Center",
          logo: JiraLogo,
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-8 w-full">
          {jiraPatFormFields.map((field) => (
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
        <div className="relative flex gap-4">
          <Button variant="primary" onClick={handlePATAuthentication} disabled={isLoading}>
            {isLoading ? t("common.authorizing") : t("importers.connect_importer", { serviceName: "Jira" })}
          </Button>
          <Button variant="ghost" className="font-medium" onClick={clearFromData} disabled={isLoading}>
            {t("common.clear")}
          </Button>
        </div>
      </div>
    </div>
  );
});
