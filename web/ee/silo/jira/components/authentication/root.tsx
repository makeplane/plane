"use client";

import { FC } from "react";
import { Button } from "@plane/ui";
import { JiraAuthState } from "@silo/jira";
// hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";
import { useImporter } from "@/plane-web/silo/jira/hooks";

export const UserAuthentication: FC = () => {
  // hooks
  const { workspaceSlug, workspaceId, userId, serviceToken } = useBaseImporter();
  const { importerAuthService } = useImporter();

  const handleAuthentication = async () => {
    if (!serviceToken) return;

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
      console.error("error", error);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center space-y-6">
      <div className="text-center space-y-4">
        <h5 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Jira to Plane Migration Assistant
        </h5>
        <p className="text-custom-text-200 text-base">
          Seamlessly migrate your Jira projects to Plane with our powerful assistant.
        </p>
      </div>
      {serviceToken && workspaceSlug && workspaceId && userId && (
        <Button onClick={handleAuthentication}>Connect Jira</Button>
      )}
    </div>
  );
};
