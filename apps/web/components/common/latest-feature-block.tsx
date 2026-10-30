/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import Link from "next/link";
import { useTheme } from "next-themes";
// icons
import { ThoughtsOutline } from "@makeplane/propel/icons";
// images
import latestFeatures from "@/app/assets/onboarding/onboarding-pages.webp?url";

export function LatestFeatureBlock() {
  const { t } = useTranslation();

  const { resolvedTheme } = useTheme();

  return (
    <>
      <div className="mx-auto mt-16 flex rounded-[3.5px] border border-subtle bg-surface-1 py-2 sm:w-96">
        <ThoughtsOutline className="mx-3 mr-2 h-7 w-7" />
        <p className="text-left text-13 text-primary">
          {t("web_ui.pages_gets_a_facelift_write_anything_and_use_galileo_to_help_you_start")}{" "}
          <Link href="https://plane.so/changelog" target="_blank" rel="noopener noreferrer">
            <span className="text-13 font-medium underline hover:cursor-pointer">
              {t("wiki.upgrade_flow.learn_more_button.text")}
            </span>
          </Link>
        </p>
      </div>
      <div
        className={`mx-auto mt-8 overflow-hidden rounded-md border border-subtle object-cover sm:h-52 sm:w-96 ${
          resolvedTheme === "dark" ? "bg-surface-1" : "bg-layer-2"
        }`}
      >
        <div className="h-[90%]">
          <img
            src={latestFeatures}
            alt={t("web_ui.plane_work_items")}
            className={`-mt-2 ml-10 h-full rounded-md ${resolvedTheme === "dark" ? "bg-surface-1" : "bg-layer-2"}`}
          />
        </div>
      </div>
    </>
  );
}
