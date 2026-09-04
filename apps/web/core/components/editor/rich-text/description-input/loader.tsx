/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

type Props = {
  className?: string;
};

export function DescriptionInputLoader(props: Props) {
  const { t } = useTranslation();
  const { className } = props;

  return (
    <Skeleton aria-label={t("aria_labels.loading.description")}>
      <div className={cn("space-y-2", className)}>
        <SkeletonItem blockSize="26px" />
        <div className="flex items-center gap-2">
          <SkeletonItem blockSize="26px" inlineSize="26px" />
          <SkeletonItem blockSize="26px" inlineSize="400px" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonItem blockSize="26px" inlineSize="26px" />
          <SkeletonItem blockSize="26px" inlineSize="400px" />
        </div>
        <SkeletonItem blockSize="26px" inlineSize="80%" />
        <div className="flex items-center gap-2">
          <SkeletonItem blockSize="26px" inlineSize="50%" />
        </div>
        <div className="border-0.5 absolute right-3.5 bottom-2 z-10 flex items-center gap-2">
          <SkeletonItem blockSize="26px" inlineSize="100px" />
          <SkeletonItem blockSize="26px" inlineSize="50px" />
        </div>
      </div>
    </Skeleton>
  );
}
