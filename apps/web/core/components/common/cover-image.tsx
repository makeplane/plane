/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { cn } from "@plane/utils";
// helpers
import { getCoverImageDisplayURL, DEFAULT_COVER_IMAGE_URL } from "@/helpers/cover-image.helper";

type TCoverImageProps = {
  /** The cover image URL - can be static, uploaded, or external */
  src: string | null | undefined;
  /** Alt text for the image */
  alt?: string;
  /** Additional className for the image or skeleton */
  className?: string;
  /** Whether to show default image when src is null/undefined. If false, shows loading skeleton */
  showDefaultWhenEmpty?: boolean;
  /** Custom fallback URL to use instead of DEFAULT_COVER_IMAGE_URL */
  fallbackUrl?: string;
} & React.ComponentProps<"img">;

/**
 * A reusable cover image component that handles:
 * - Loading states with skeleton
 * - Static images (local assets)
 * - Uploaded images (processed through getFileURL)
 * - External URLs
 * - Fallback to default cover image on load error
 */
export function CoverImage(props: TCoverImageProps) {
  const {
    src,
    alt = "Cover image",
    className,
    showDefaultWhenEmpty = false,
    fallbackUrl = DEFAULT_COVER_IMAGE_URL,
    onError,
    ...restProps
  } = props;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  // Show loading skeleton when src is undefined/null and we don't want to show default
  if (!src && !showDefaultWhenEmpty) {
    return <div className={cn("bg-layer-2 animate-pulse", className)} />;
  }

  const displayUrl = failedSrc === src ? fallbackUrl : getCoverImageDisplayURL(src, fallbackUrl);

  return (
    <img
      src={displayUrl}
      alt={alt}
      className={cn("object-cover", className)}
      onError={(e) => {
        setFailedSrc(src ?? null);
        onError?.(e);
      }}
      {...restProps}
    />
  );
}
