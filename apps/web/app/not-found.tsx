/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import Link from "next/link";
// ui
import { Button } from "@makeplane/propel/components/button";
// images
import Image404 from "@/app/assets/404.svg?url";
// types
import type { Route } from "./+types/not-found";

export const meta: Route.MetaFunction = () => [
  { title: "404 - Page Not Found" },
  { name: "robots", content: "noindex, nofollow" },
];

function PageNotFound() {
  const { t } = useTranslation();

  return (
    <div className={`h-screen w-full overflow-hidden bg-surface-1`}>
      <div className="grid h-full place-items-center p-4">
        <div className="space-y-8 text-center">
          <div className="relative mx-auto h-60 w-60 lg:h-80 lg:w-80">
            <img src={Image404} className="h-full w-full object-contain" alt={t("web_ui.404_page_not_found")} />
          </div>
          <div className="space-y-2">
            <h3 className="text-16 font-semibold">{t("web_ui.oops_something_went_wrong")}</h3>
            <p className="text-13 text-secondary">
              {t(
                "web_ui.sorry_the_page_you_are_looking_for_cannot_be_found_it_may_have_been_removed_had_its_name_c"
              )}{" "}
            </p>
          </div>
          <div className="flex justify-center">
            <Button
              variant="secondary"
              size="md"
              stretch="auto"
              label={t("power_k.navigation_actions.nav_home")}
              nativeButton={false}
              render={<Link href="/" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageNotFound;
