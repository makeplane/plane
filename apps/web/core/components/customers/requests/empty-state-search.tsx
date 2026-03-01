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

import type { FC } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import { useTranslation } from "@plane/i18n";
import RequestEmptyDark from "@/app/assets/empty-state/customers/request-search-dark.svg?url";
import RequestEmptyLight from "@/app/assets/empty-state/customers/request-search-light.svg?url";

export const CustomerRequestSearchEmptyState = observer(function CustomerRequestSearchEmptyState() {
  // i18n
  const { t } = useTranslation();
  // hooks
  const { resolvedTheme } = useTheme();
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-md p-2">
        <img
          src={resolvedTheme === "dark" ? RequestEmptyDark : RequestEmptyLight}
          alt="request-empty"
          className="w-full h-full object-cover"
        />
      </div>
      <span className="text-center text-14 font-medium">{t("customers.requests.empty_state.search.title")}</span>
      <span className="text-center text-13 text-secondary">
        {/* TODO: Translate here */}
        Try with another search term or{" "}
        <a href="mailto:support@plane.so" className="underline">
          reach out to us
        </a>{" "}
        if you are sure you should see results for that term.
      </span>
    </div>
  );
});
