"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
// plane web hooks
import { useAsanaImporter } from "@/plane-web/hooks/store";

export const OAuth: FC = observer(() => {
  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // hooks
  const {
    auth: { oAuthInitiate },
  } = useAsanaImporter();

  const handleOAuthAuthentication = async () => {
    setIsLoading(true);
    try {
      const response = await oAuthInitiate();
      if (response) window.open(response);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.toString() || "Something went wrong while authorizing Asana",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full overflow-y-auto">
      <div className="relative flex items-center justify-between gap-3 pb-3.5">
        <div>
          <h3 className="text-xl font-medium">Asana to Plane Migration Assistant</h3>
          <p className="text-custom-text-300 text-sm">
            Seamlessly migrate your Asana projects to Plane with our powerful assistant.
          </p>
        </div>
        <div>
          <Button onClick={handleOAuthAuthentication} loading={isLoading} disabled={isLoading}>
            {isLoading ? "Authorizing" : "Connect Asana"}
          </Button>
        </div>
      </div>
    </section>
  );
});
