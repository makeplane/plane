/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
// assets
import SomethingWentWrongImage from "@/app/assets/something-went-wrong.svg?url";

function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="grid h-screen w-screen place-items-center bg-surface-1">
      <div className="text-center">
        <div className="mx-auto grid size-32 place-items-center rounded-full md:size-52">
          <div className="grid size-16 place-items-center md:size-32">
            <img src={SomethingWentWrongImage} alt={t("space_public.something_went_wrong")} width={128} height={128} />
          </div>
        </div>
        <h1 className="mt-8 text-18 font-semibold md:mt-12 md:text-24">{t("space_public.not_found_title")}</h1>
        <p className="mt-2 text-13 md:mt-4 md:text-14">{t("space_public.not_found_hint")}</p>
      </div>
    </div>
  );
}

export default NotFound;
