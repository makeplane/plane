/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// assets
import PlaneTakeOffImage from "@/app/assets/images/plane-takeoff.png?url";

export function InstanceNotReady() {
  const { t } = useTranslation();

  return (
    <div className="h-full w-full relative container px-5 mx-auto flex justify-center items-center">
      <div className="w-auto max-w-2xl relative space-y-8 py-10">
        <div className="relative flex flex-col justify-center items-center space-y-4">
          <h1 className="text-24 font-bold pb-3">{t("admin.welcome_title")}</h1>
          <img src={PlaneTakeOffImage} alt="Plane Logo" />
          <p className="font-medium text-14 text-placeholder">{t("admin.welcome_description")}</p>
        </div>

        <div>
          <Link href={"/setup/?auth_enabled=0"}>
            <Button size="xl" className="w-full">
              {t("admin.get_started")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
