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
// plane imports
import { useTranslation } from "@plane/i18n";
import { ScopeIcon, OverviewIcon, PageIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";

type ReleaseDetailHeaderProps = {
  selectedTab: "overview" | "scope" | "changelog";
};

const TABS = [
  { key: "overview" as const, titleKey: "releases.overview", pathSuffix: "/overview", icon: OverviewIcon },
  { key: "scope" as const, titleKey: "releases.scope", pathSuffix: "/scope", icon: ScopeIcon },
  { key: "changelog" as const, titleKey: "releases.changelog", pathSuffix: "/changelog", icon: PageIcon },
] as const;

export const ReleaseDetailHeader = observer(function ReleaseDetailHeader(props: ReleaseDetailHeaderProps) {
  const { selectedTab } = props;
  const { workspaceSlug, releaseId } = useParams<{ workspaceSlug: string; releaseId: string }>();
  const { t } = useTranslation();

  if (!workspaceSlug || !releaseId) return null;

  const basePath = `/${workspaceSlug}/releases/${releaseId}`;

  return (
    <div className="shrink-0 h-12 border-b border-subtle px-4 pt-2">
      <div className="flex items-center gap-1 h-full">
        {TABS.map((tab) => {
          const href = `${basePath}${tab.pathSuffix}`;
          const isActive = selectedTab === tab.key;

          return (
            <Link
              key={tab.key}
              to={href}
              className={cn(
                "group relative cursor-pointer text-body-xs-medium h-full transition-colors border-b-2 border-transparent",
                isActive && "border-strong-1"
              )}
            >
              <div
                className={cn(
                  "h-7 flex items-center justify-center gap-2 px-3 rounded-md group-hover:bg-layer-transparent-hover transition-colors",
                  isActive && "bg-layer-transparent-active group-hover:bg-layer-transparent-active"
                )}
              >
                <tab.icon className="size-4 shrink-0" />
                <span>{t(tab.titleKey)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
});
