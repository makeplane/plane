"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
// plane web hooks
import { useJiraImporter } from "@/plane-web/hooks/store";
// plane web components
import { AuthFormInput, TAuthFormInputFormField } from "@/plane-web/silo/ui/auth-form-input";
// plane web types
import { TJiraPATFormFields } from "@/plane-web/types";

export const PersonalAccessTokenAuth: FC = observer(() => {
  // hooks
  const {
    auth: { authWithPAT },
  } = useJiraImporter();

  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<TJiraPATFormFields>({
    personalAccessToken: "",
    userEmail: "",
    hostname: "",
  });

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
      await authWithPAT(formData);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.toString() || "Something went wrong while authorizing Jira",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // JIRA PAT form fields
  const jiraPatFormFields: TAuthFormInputFormField[] = [
    {
      key: "JIRA_PAT",
      type: "password",
      label: "Personal Access Token",
      value: formData.personalAccessToken,
      onChange: (e) => handleFormData("personalAccessToken", e.target.value),
      description: (
        <>
          You will get this from your{" "}
          <a
            tabIndex={-1}
            href="https://id.atlassian.com/manage-profile/security/api-tokens"
            target="_blank"
            className="text-custom-primary-100 hover:underline"
            rel="noreferrer"
          >
            Atlassian security settings.
          </a>
        </>
      ),
      placeholder: "ATATT9SDAKLFJ9SALJ",
      error: false,
    },
    {
      key: "JIRA_USER_EMAIL",
      type: "text",
      label: "User email",
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
    <div className="space-y-6">
      <div className="relative flex flex-col border-b border-custom-border-100 pb-3.5">
        <h3 className="text-xl font-medium">Jira to Plane Migration Assistant</h3>
        <p className="text-custom-text-300 text-sm">
          Seamlessly migrate your Jira projects to Plane with our powerful assistant.
        </p>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 w-full">
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
            {isLoading ? "Authorizing" : "Connect Jira"}
          </Button>
          <Button variant="link-neutral" className="font-medium" onClick={clearFromData} disabled={isLoading}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
});
