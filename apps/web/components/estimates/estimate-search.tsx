/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { observer } from "mobx-react";

export const EstimateSearch = observer(function EstimateSearch() {
  const { t } = useTranslation();

  return <div>{t("web_ui.estimate_search")}</div>;
});
