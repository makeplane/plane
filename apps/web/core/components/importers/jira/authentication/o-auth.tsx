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
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// plane web hooks
import { useJiraImporter } from "@/plane-web/hooks/store";

export const OAuth = observer(function OAuth() {
  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // hooks
  const {
    auth: { oAuthInitiate },
  } = useJiraImporter();

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
        message: error?.toString() || "Something went wrong while authorizing Jira",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full overflow-y-auto">
      <div className="relative flex items-center justify-between gap-3 pb-3.5">
        <div>
          <h3 className="text-18 font-medium">Jira to Plane {t("importers.migration_assistant")}</h3>
          <p className="text-tertiary text-13">
            {t("importers.migration_assistant_description", { serviceName: "Jira" })}
          </p>
        </div>
        <div>
          <Button onClick={handleOAuthAuthentication} loading={isLoading} disabled={isLoading}>
            {isLoading ? t("common.authorizing") : t("importers.connect_importer", { serviceName: "Jira" })}
          </Button>
        </div>
      </div>
    </section>
  );
});
