/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
import { useTranslation } from "@plane/i18n";
export function EstimateLoaderScreen() {
  const { t } = useTranslation();
  return (
    <Skeleton aria-label={t("aria_labels.loading.estimates")}>
      <div className="mt-5 space-y-5">
        <SkeletonItem blockSize="40px" />
        <SkeletonItem blockSize="40px" />
        <SkeletonItem blockSize="40px" />
        <SkeletonItem blockSize="40px" />
      </div>
    </Skeleton>
  );
}
