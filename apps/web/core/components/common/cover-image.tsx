/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
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
  const [hasError, setHasError] = useState(false);

  // Reset error state when src changes so new URLs get a fresh attempt
  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Show loading skeleton when src is undefined/null and we don't want to show default
  if (!src && !showDefaultWhenEmpty) {
    return <div className={cn("bg-layer-2 animate-pulse", className)} />;
  }

  const displayUrl = hasError ? fallbackUrl : getCoverImageDisplayURL(src, fallbackUrl);

  return (
    <img
      src={displayUrl}
      alt={alt}
      className={cn("object-cover", className)}
      onError={(e) => {
        setHasError(true);
        onError?.(e);
      }}
      {...restProps}
    />
  );
}
