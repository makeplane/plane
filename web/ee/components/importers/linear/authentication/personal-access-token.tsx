"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
// plane web hooks
import { useLinearImporter } from "@/plane-web/hooks/store";
// plane web components
import { AuthFormInput, TAuthFormInputFormField } from "@/plane-web/silo/ui/auth-form-input";
// plane web types
import { TLinearPATFormFields } from "@/plane-web/types/importers/linear";
import { useTranslation } from "@plane/i18n";
import { TImporterPATError } from "@/plane-web/types";
import ErrorBanner from "../../ui/error-banner";

export const PersonalAccessTokenAuth: FC = observer(() => {
  // hooks
  const {
    auth: { authWithPAT },
  } = useLinearImporter();
  const { t } = useTranslation();

  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<TLinearPATFormFields>({
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
  const handleFormData = <T extends keyof TLinearPATFormFields>(key: T, value: TLinearPATFormFields[T]) => {
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
      updatePATError(message || "Something went wrong while authorizing Jira");
      togglePATError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // LINEAR PAT form fields
  const linearPatFormFields: TAuthFormInputFormField[] = [
    {
      key: "LINEAR_PAT",
      type: "password",
      label: "Personal Access Token",
      value: formData.personalAccessToken,
      onChange: (e) => handleFormData("personalAccessToken", e.target.value),
      description: (
        <>
          {t("importers.token_helper")}{" "}
          <a
            tabIndex={-1}
            href="https://linear.app/docs/security-and-access#personal-api-keys"
            target="_blank"
            className="text-custom-primary-100 hover:underline"
            rel="noreferrer"
          >
            Linear Security Settings.
          </a>
        </>
      ),
      placeholder: "lin_api_h6C1asD1s6",
      error: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="relative flex flex-col border-b border-custom-border-100 pb-3.5">
        <h3 className="text-xl font-medium">Linear to Plane {t("importers.migration_assistant")}</h3>
        <p className="text-custom-text-300 text-sm">
          {t("importers.migration_assistant_description", { "serviceName": "Linear" })}
        </p>
      </div>
      <div className="space-y-6">
        {
          patError.showPATError && (
            <ErrorBanner message={t("importers.invalid_pat")} onClose={() => { togglePATError(false) }} />
          )
        }
        {linearPatFormFields.map((field) => (
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
          <Button variant="link-neutral" className="font-medium" onClick={clearFromData} disabled={isLoading}>
            {t("common.clear")}
          </Button>
          <Button variant="primary" onClick={handlePATAuthentication} disabled={isLoading}>
            {isLoading ? t("common.authorizing") : t("importers.connect_importer", { "serviceName": "Linear" })}
          </Button>
        </div>
      </div>
    </div>
  );
});
