/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";

export const ProductUpdatesHeader = observer(function ProductUpdatesHeader() {
  const { t } = useTranslation();
  return (
    <div className="mx-6 my-4 flex flex-shrink-0 items-center justify-between gap-2">
      <div className="flex w-full items-center">
        <div className="flex gap-2 text-18 font-medium">{t("whats_new")}</div>
      </div>
    </div>
  );
});
