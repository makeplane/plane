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

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;
};

export const WikiAuthScreen = observer(function WikiAuthScreen({ workspaceSlug }: Props) {
  // router
  const router = useAppRouter();
  // translation
  const { t } = useTranslation();

  const handleProjectsRedirection = () => {
    router.push(`/${workspaceSlug}`);
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <>
      <div className="size-full grid place-items-center px-page-x">
        <div className="w-full md:w-3/4 xl:w-1/2 2xl:w-1/3 text-center">
          <h2 className="text-20 font-semibold">{t("wiki.auth.title")}</h2>
          <p className="mt-3 text-secondary text-13 md:text-14">{t("wiki.auth.description")}</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button variant="primary" onClick={handleProjectsRedirection} className="shrink-0">
              {t("wiki.auth.redirection_button.text")}
            </Button>
            <Button variant="secondary" onClick={handleReload} className="shrink-0">
              {t("wiki.auth.reload_button.text")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
});
