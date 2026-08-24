/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { USER_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { getButtonStyling } from "@plane/propel/button";
import { cn } from "@plane/utils";
import { InstanceBrandMark } from "@/components/brand/instance-brand-mark";
import { useBrand } from "@/hooks/use-brand";

export const ProductUpdatesFooter = observer(function ProductUpdatesFooter() {
  const { t } = useTranslation();
  const { name, supportEmail, hidePlaneMarketing } = useBrand();

  return (
    <div className="m-6 mb-4 flex flex-shrink-0 items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {!hidePlaneMarketing && (
          <>
            <a
              href="https://go.plane.so/p-docs"
              target="_blank"
              className="text-13 text-secondary underline-offset-1 outline-none hover:text-primary hover:underline"
              rel="noreferrer"
            >
              {t("docs")}
            </a>
            <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
              <circle cx={1} cy={1} r={1} />
            </svg>
            <a
              data-ph-element={USER_TRACKER_ELEMENTS.CHANGELOG_REDIRECTED}
              href="https://go.plane.so/p-changelog"
              target="_blank"
              className="text-13 text-secondary underline-offset-1 outline-none hover:text-primary hover:underline"
              rel="noreferrer"
            >
              {t("full_changelog")}
            </a>
            <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
              <circle cx={1} cy={1} r={1} />
            </svg>
          </>
        )}
        <a
          href={`mailto:${supportEmail}`}
          target="_blank"
          className="text-13 text-secondary underline-offset-1 outline-none hover:text-primary hover:underline"
          rel="noreferrer"
        >
          {t("support")}
        </a>
        {!hidePlaneMarketing && (
          <>
            <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
              <circle cx={1} cy={1} r={1} />
            </svg>
            <a
              href="https://forum.plane.so"
              target="_blank"
              className="text-13 text-secondary underline-offset-1 outline-none hover:text-primary hover:underline"
              rel="noreferrer"
            >
              Forum
            </a>
          </>
        )}
      </div>
      {!hidePlaneMarketing && (
        <a
          href="https://plane.so/pages"
          target="_blank"
          className={cn(
            getButtonStyling("secondary", "base"),
            "flex items-center gap-1.5 text-center font-medium underline-offset-2 outline-none hover:underline"
          )}
          rel="noreferrer"
        >
          <InstanceBrandMark className="h-4 w-auto text-primary" />
          {t("powered_by_plane_pages", { brand: name })}
        </a>
      )}
      {hidePlaneMarketing && <InstanceBrandMark className="h-4 w-auto text-primary" />}
    </div>
  );
});
