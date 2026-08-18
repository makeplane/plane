/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Link, useLocation, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Header, EHeaderVariant } from "@plane/ui";
import { cn } from "@plane/utils";

export const TESTHUB_NAV = [
  { key: "overview", path: "", i18n: "testhub.nav.overview" },
  { key: "sessions", path: "/sessions", i18n: "testhub.nav.sessions" },
  { key: "tools", path: "/tools", i18n: "testhub.nav.tools" },
  { key: "sql", path: "/sql", i18n: "testhub.nav.sql" },
  { key: "pytest", path: "/pytest", i18n: "testhub.nav.pytest" },
  { key: "bind", path: "/bind", i18n: "testhub.nav.bind" },
] as const;

export function TesthubTabNavigation() {
  const { t } = useTranslation();
  const location = useLocation();
  const { workspaceSlug, projectId } = useParams();
  const base = `/${workspaceSlug}/projects/${projectId}/testhub`;

  return (
    <Header variant={EHeaderVariant.SECONDARY} className="z-[12] min-h-[44px] bg-surface-1">
      <Header.LeftItem className="max-w-full">
        <div className="relative flex h-full items-center overflow-x-auto">
          {TESTHUB_NAV.map((item) => {
            const href = `${base}${item.path}`;
            const active =
              item.path === ""
                ? location.pathname === href || location.pathname === `${href}/`
                : location.pathname.startsWith(href);
            return (
              <Link key={item.key} to={href} className="flex h-full flex-col">
                <div
                  className={cn("flex flex-1 items-center justify-center px-4 text-13 font-medium whitespace-nowrap", {
                    "text-accent-primary": active,
                    "text-secondary": !active,
                  })}
                >
                  {t(item.i18n)}
                </div>
                <div
                  className={cn("w-full rounded-t border-t-2 border-transparent", {
                    "border-accent-strong": active,
                  })}
                />
              </Link>
            );
          })}
        </div>
      </Header.LeftItem>
    </Header>
  );
}
