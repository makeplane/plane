/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";
import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
import { useTranslation } from "@plane/i18n";

export function HomeLoader() {
  const { t } = useTranslation();
  return (
    <>
      {range(3).map((index) => (
        <div key={index}>
          <Skeleton aria-label={t("aria_labels.loading.home_widget")}>
            <div className="mb-2">
              <div className="mb-4">
                <SkeletonItem blockSize="20px" inlineSize="100px" />
              </div>
              <div className="h-[110px] w-full rounded-sm">
                <SkeletonItem blockSize="100%" inlineSize="100%" />
              </div>
            </div>
          </Skeleton>
        </div>
      ))}
    </>
  );
}
