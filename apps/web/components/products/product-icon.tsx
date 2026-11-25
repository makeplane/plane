/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { CubeOutline } from "@makeplane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";

/** Marks a work item as a product. */
export function ProductIcon() {
  const { t } = useTranslation();
  return (
    // oxlint-disable-next-line jsx_a11y/prefer-tag-over-role
    <span role="img" aria-label={t("product.kinds.product")} className="shrink-0">
      <CubeOutline className="size-3.5 text-accent-primary" />
    </span>
  );
}
