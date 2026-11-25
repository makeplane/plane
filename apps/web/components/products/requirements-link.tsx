/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
// plane imports
import { useTranslation } from "@plane/i18n";

type Props = { workspaceSlug: string; productTypeId: string };

export function ProductRequirementsLink({ workspaceSlug, productTypeId }: Props) {
  const { t } = useTranslation();
  return (
    <Link
      href={`/${workspaceSlug}/product-types/${productTypeId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-caption-md-regular text-accent-primary hover:underline"
    >
      {t("product.requirements")}
    </Link>
  );
}
