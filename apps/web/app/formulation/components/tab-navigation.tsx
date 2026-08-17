/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Link, useLocation, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Header, EHeaderVariant } from "@plane/ui";
import { cn } from "@plane/utils";

export const FORMULATION_NAV = [
  { key: "scenes", path: "", i18n: "formulation.nav.scenes" },
  { key: "action_words", path: "/action-words", i18n: "formulation.nav.action_words" },
  { key: "automation", path: "/automation", i18n: "formulation.nav.automation" },
] as const;

export function FormulationTabNavigation() {
  const { t } = useTranslation();
  const location = useLocation();
  const { workspaceSlug, projectId } = useParams();
  const base = `/${workspaceSlug}/projects/${projectId}/formulation`;

  return (
    <Header variant={EHeaderVariant.SECONDARY} className="z-[12] min-h-[44px] bg-surface-1">
      <Header.LeftItem className="max-w-full">
        <div className="relative flex h-full items-center overflow-x-auto">
          {FORMULATION_NAV.map((item) => {
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
