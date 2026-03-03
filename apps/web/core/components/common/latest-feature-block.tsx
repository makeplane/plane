/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
import { useTheme } from "next-themes";
// icons
import { Lightbulb } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// images
import latestFeatures from "@/app/assets/onboarding/onboarding-pages.webp?url";

export function LatestFeatureBlock() {
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <div className="mx-auto mt-16 flex rounded-[3.5px] border border-subtle bg-surface-1 py-2 sm:w-96">
        <Lightbulb className="mx-3 mr-2 h-7 w-7" />
        <p className="text-left text-13 text-primary">
          {t("latest_feature_block.message")}{" "}
          <Link href="https://plane.so/changelog" target="_blank" rel="noopener noreferrer">
            <span className="text-13 font-medium underline hover:cursor-pointer">{t("common.learn_more")}</span>
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
            alt={t("latest_feature_block.image_alt")}
            className={`-mt-2 ml-10 h-full rounded-md ${resolvedTheme === "dark" ? "bg-surface-1" : "bg-layer-2"}`}
          />
        </div>
      </div>
    </>
  );
}
