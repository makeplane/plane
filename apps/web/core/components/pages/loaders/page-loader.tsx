/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
import { useTranslation } from "@plane/i18n";
import { range } from "lodash-es";

export function PageLoader() {
  const { t } = useTranslation();
  return (
    <Skeleton aria-label={t("aria_labels.loading.page")}>
      <div className="relative flex h-full w-full flex-col">
        <div className="border-b border-subtle px-3 py-3">
          <div className="relative flex items-center gap-2">
            <SkeletonItem blockSize="30px" inlineSize="200px" />
            <div className="relative ml-auto flex items-center gap-2">
              <SkeletonItem blockSize="30px" inlineSize="100px" />
              <SkeletonItem blockSize="30px" inlineSize="100px" />
            </div>
          </div>
        </div>
        <div>
          {range(10).map((i) => (
            <div key={i} className="relative flex items-center gap-2 border-b border-subtle p-3 py-4">
              <SkeletonItem blockSize="22px" inlineSize={`${250 + 10 * (i % 10)}px`} />
              <div className="relative ml-auto flex items-center gap-2">
                <SkeletonItem blockSize="22px" inlineSize="60px" />
                <SkeletonItem blockSize="22px" inlineSize="22px" />
                <SkeletonItem blockSize="22px" inlineSize="22px" />
                <SkeletonItem blockSize="22px" inlineSize="22px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Skeleton>
  );
}
