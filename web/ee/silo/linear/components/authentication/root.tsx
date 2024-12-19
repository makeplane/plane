"use client";

import { FC } from "react";
import { Button } from "@plane/ui";
import { LinearAuthState } from "@silo/linear";
// hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";
import { useImporter } from "@/plane-web/silo/linear/hooks";

export const UserAuthentication: FC = () => {
  // hooks
  const { workspaceSlug, workspaceId, userId, serviceToken } = useBaseImporter();
  const { importerAuthService } = useImporter();

  const handleAuthentication = async () => {
    if (!serviceToken) return;

    const payload: LinearAuthState = {
      workspaceSlug,
      workspaceId,
      userId,
      apiToken: serviceToken,
    };

    try {
      const response = await importerAuthService.linearAuthentication(payload);
      window.open(response);
    } catch (error) {
      console.error("error", error);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center space-y-6">
      <div className="text-center space-y-4">
        <h5 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Linear to Plane Migration Assistant
        </h5>
        <p className="text-custom-text-200 text-base">
          Seamlessly migrate your linear projects to Plane with our powerful assistant.
        </p>
      </div>
      {serviceToken && workspaceSlug && workspaceId && userId && (
        <Button onClick={handleAuthentication}>Connect Linear</Button>
      )}
    </div>
  );
};
