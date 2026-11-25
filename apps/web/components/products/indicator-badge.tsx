/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Badge } from "@makeplane/propel/components/badge";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TProductIndicator } from "@plane/types";
// local imports
import { INDICATOR_VARIANTS } from "./helper";

export function ProductIndicatorBadge({ indicator }: { indicator: TProductIndicator }) {
  const { t } = useTranslation();
  return <Badge size="xs" variant={INDICATOR_VARIANTS[indicator]} label={t(`product.indicators.${indicator}`)} />;
}
