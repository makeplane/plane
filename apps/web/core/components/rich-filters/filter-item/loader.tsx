/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
import { useTranslation } from "@plane/i18n";
export function FilterItemLoader() {
  const { t } = useTranslation();
  return (
    <Skeleton aria-label={t("aria_labels.loading.filter")}>
      <SkeletonItem blockSize="28px" inlineSize="180px" />
    </Skeleton>
  );
}
