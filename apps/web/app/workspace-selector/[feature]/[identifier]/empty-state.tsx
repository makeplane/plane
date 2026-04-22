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
import Link from "next/link";
import { useTheme } from "@plane/react-theme";
// plane imports
import { useTranslation } from "@plane/i18n";
import { getButtonStyling } from "@plane/propel/button";
import { cn } from "@plane/utils";
// assets
import emptyWorkspaceDarkPng from "@/app/assets/empty-state/marketplace/empty-workspace-dark.png?url";
import emptyWorkspaceLightPng from "@/app/assets/empty-state/marketplace/empty-workspace-light.png?url";

export const WorkspaceSelectorEmptyState = observer(function WorkspaceSelectorEmptyState() {
  // plane hooks
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  // derived values
  const image = resolvedTheme === "light" ? emptyWorkspaceLightPng : emptyWorkspaceDarkPng;

  return (
    <div className="relative flex flex-col gap-4 h-full w-full justify-center px-8 pb-8 items-center">
      <div className="text-28 font-bold text-center">{t("no_workspaces_to_connect")}</div>
      <div className="font-medium text-tertiary max-w-[450px] text-center">
        {t("no_workspaces_to_connect_description")}
      </div>
      <div className="overflow-y-auto vertical-scrollbar scrollbar-sm mb-10 w-full md:w-fit">
        <div className="w-full flex flex-col gap-2 items-center md:w-[450px]">
          <img src={image} alt="empty workspace" width={384} height={250} />
          <div className="flex gap-2 flex-col md:flex-row">
            <a
              href="https://docs.plane.so/core-concepts/workspaces/overview"
              target="_blank"
              className={cn(getButtonStyling("secondary", "base"), "border-subtle-1 text-primary")}
              rel="noreferrer"
            >
              {t("learn_more_about_workspaces")}
            </a>
            <Link
              href="/create-workspace"
              className={cn("text-13 text-tertiary w-full", getButtonStyling("primary", "base"))}
            >
              {t("create_a_new_workspace")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});
