"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
// plane web hooks
import { useLinearImporter } from "@/plane-web/hooks/store";
import { useTranslation } from "@plane/i18n";

export const OAuth: FC = observer(() => {
  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // hooks
  const {
    auth: { oAuthInitiate },
  } = useLinearImporter();
  const { t } = useTranslation();

  const handleOAuthAuthentication = async () => {
    try {
      setIsLoading(true);
      const response = await oAuthInitiate();
      if (response) window.open(response, "_self");
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.toString() || "Something went wrong while authorizing Linear",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full overflow-y-auto">
      <div className="relative flex items-center justify-between gap-3 pb-3.5">
        <div>
          <h3 className="text-xl font-medium">Linear to Plane {t("importers.migration_assistant")}</h3>
          <p className="text-custom-text-300 text-sm">
            {t("importers.migration_assistant_description", { serviceName: "Linear" })}
          </p>
        </div>
        <div>
          <Button onClick={handleOAuthAuthentication} loading={isLoading} disabled={isLoading}>
            {isLoading ? t("common.authorizing") : t("importers.connect_importer", { serviceName: "Linear" })}
          </Button>
        </div>
      </div>
    </section>
  );
});
