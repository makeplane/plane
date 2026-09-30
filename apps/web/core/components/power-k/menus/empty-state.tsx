/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import React from "react";
import { useTranslation } from "@plane/i18n";

type Props = {
  emptyText?: string;
};

export function PowerKMenuEmptyState({ emptyText }: Props) {
  const { t } = useTranslation();
  return (
    <div className="px-3 py-8 text-center text-13 text-tertiary">
      {emptyText ?? t("power_k.search_menu.no_results")}
    </div>
  );
}
