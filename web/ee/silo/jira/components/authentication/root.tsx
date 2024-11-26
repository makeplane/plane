"use client";

import { FC, useState } from "react";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
// importer
import { E_IMPORTER_KEYS } from "@silo/core";
// jira
import { JiraAuthState, JiraPATAuthState } from "@silo/jira";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web hooks
import { useBaseImporter, useSyncConfig } from "@/plane-web/silo/hooks";
import { useImporter } from "@/plane-web/silo/jira/hooks";
// plane web components
import { AuthFormInput, TAuthFormInputFormField } from "@/plane-web/silo/ui/auth-form-input";

type TProps = {
  isOAuthEnabled: boolean;
};

export const UserAuthentication: FC<TProps> = (props) => {
  const { isOAuthEnabled } = props;
  // states
  const [token, setToken] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [jiraDomain, setJiraDomain] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // hooks
  const { mutate } = useSyncConfig(E_IMPORTER_KEYS.JIRA);
  const { workspaceSlug, workspaceId, userId, serviceToken } = useBaseImporter();
  const { importerAuthService } = useImporter();

  const handleOAuthAuthentication = async () => {
    if (!serviceToken) return;

    setIsLoading(true);
    const payload: JiraAuthState = {
      workspaceSlug,
      workspaceId,
      userId,
      apiToken: serviceToken,
    };

    try {
      const response = await importerAuthService.jiraAuthentication(payload);
      window.open(response);
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

  const handlePATAuthentication = async () => {
    if (!workspaceId || !userId || !serviceToken || !token) return;

    setIsLoading(true);
    const payload: JiraPATAuthState = {
      workspaceId,
      userId,
      apiToken: serviceToken,
      personalAccessToken: token,
      userEmail,
      hostname: jiraDomain,
    };

    try {
      await importerAuthService.jiraPATAuthentication(payload);
      mutate();
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

  const handleClear = () => {
    setToken("");
    setUserEmail("");
    setJiraDomain("");
  };

  const JIRA_PAT_FORM_FIELDS: TAuthFormInputFormField[] = [
    {
      key: "JIRA_PAT",
      type: "password",
      label: "Personal Access Token",
      value: token,
      onChange: (e) => setToken(e.target.value),
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
      value: userEmail,
      onChange: (e) => setUserEmail(e.target.value),
      description: "This is the email linked to your personal access token",
      placeholder: "john.doe@example.com",
      error: false,
    },
    {
      key: "JIRA_DOMAIN",
      type: "text",
      label: "Jira domain",
      value: jiraDomain,
      onChange: (e) => setJiraDomain(e.target.value),
      description: "This is the domain of your Jira instance",
      placeholder: "https://jira.example.com",
      error: false,
    },
  ];

  return (
    <section className="w-full overflow-y-auto">
      <div
        className={cn("flex flex-col border-b border-custom-border-100 pb-3.5", {
          "flex-row items-center border-none justify-between": isOAuthEnabled,
        })}
      >
        <div className="flex flex-col">
          <h3 className="text-xl font-medium">Jira to Plane Migration Assistant</h3>
          <p className="text-custom-text-300 text-sm">
            Seamlessly migrate your Jira projects to Plane with our powerful assistant.
          </p>
        </div>
        {isOAuthEnabled && serviceToken && workspaceSlug && workspaceId && userId && (
          <Button onClick={handleOAuthAuthentication} loading={isLoading} disabled={isLoading}>
            {isLoading ? "Authorizing" : "Connect Jira"}
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-4 pt-4">
        {!isOAuthEnabled && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 w-full">
              {JIRA_PAT_FORM_FIELDS.map((field) => (
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
            <div className="flex gap-4 pt-4">
              <Button variant="primary" onClick={handlePATAuthentication} loading={isLoading} disabled={isLoading}>
                {isLoading ? "Authorizing" : "Connect Jira"}
              </Button>
              <Button variant="link-neutral" className="font-medium" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
