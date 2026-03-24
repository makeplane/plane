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
import { useParams, Link } from "react-router";
import { useTranslation } from "@plane/i18n";
import { ScopeIcon, OverviewIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";

type ReleaseDetailHeaderProps = {
  selectedTab: "overview" | "scope";
};

const TABS = [
  { key: "overview" as const, titleKey: "releases.overview", pathSuffix: "", Icon: OverviewIcon },
  { key: "scope" as const, titleKey: "releases.scope", pathSuffix: "/scope", Icon: ScopeIcon },
] as const;

export const ReleaseDetailHeader = observer(function ReleaseDetailHeader(props: ReleaseDetailHeaderProps) {
  const { selectedTab } = props;
  const { workspaceSlug, releaseId } = useParams<{ workspaceSlug: string; releaseId: string }>();
  const { t } = useTranslation();

  if (!workspaceSlug || !releaseId) return null;

  const basePath = `/${workspaceSlug}/releases/${releaseId}`;

  return (
    <div className="h-12 border-b border-subtle px-4 pt-2 flex items-center gap-1">
      <div className="flex items-center gap-1 h-full">
        {TABS.map((tab) => {
          const href = `${basePath}${tab.pathSuffix}`;
          const isActive = selectedTab === tab.key;
          const Icon = tab.Icon;
          return (
            <Link
              key={tab.key}
              to={href}
              className={cn(
                "relative cursor-pointer text-13 font-medium h-full transition-colors flex flex-col gap-1",
                isActive && "border-b-2 border-primary"
              )}
            >
              <div
                className={cn(
                  "h-7 flex items-center justify-center gap-2 px-3",
                  isActive && "bg-layer-transparent-active rounded-md"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{t(tab.titleKey)}</span>
              </div>
              <div
                className={cn(
                  "absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-opacity duration-200",
                  isActive ? "opacity-100" : "opacity-0"
                )}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
});
