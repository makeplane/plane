/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
import { useTranslation } from "@plane/i18n";
import { range } from "lodash-es";

export function QuickLinksWidgetLoader() {
  const { t } = useTranslation();
  return (
    <Skeleton aria-label={t("aria_labels.loading.quick_links")}>
      <div className="flex flex-wrap gap-2 rounded-xl bg-surface-1">
        {range(4).map((index) => (
          <SkeletonItem key={index} blockSize="56px" inlineSize="230px" />
        ))}
      </div>
    </Skeleton>
  );
}
