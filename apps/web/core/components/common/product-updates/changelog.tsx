/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState, useRef, useEffect } from "react";
import { observer } from "mobx-react";
// plane imports
import { WEBSITE_URL } from "@plane/constants";
import { Loader } from "@plane/ui";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
import { ProductUpdatesFallback } from "@/components/common/product-updates/fallback";

const CHANGELOG_BASE_URL = WEBSITE_URL ? `${WEBSITE_URL}/changelog-preview` : null;

export const ProductUpdatesChangelog = observer(function ProductUpdatesChangelog() {
  // refs
  const isLoadingRef = useRef(true);
  // states
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  // store hooks
  const { config } = useInstance();
  // derived values
  const category = config?.is_self_managed ? "self-hosted" : "cloud";
  const changelogUrl = CHANGELOG_BASE_URL ? `${CHANGELOG_BASE_URL}?limit=5&category=${category}` : null;
  const shouldShowFallback = !changelogUrl || hasError;

  // timeout fallback - if iframe doesn't load within 15 seconds, show error
  useEffect(() => {
    if (!changelogUrl) {
      setIsLoading(false);
      isLoadingRef.current = false;
      return;
    }

    setIsLoading(true);
    setHasError(false);
    isLoadingRef.current = true;

    const timeoutId = setTimeout(() => {
      if (isLoadingRef.current) {
        setHasError(true);
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    }, 15000); // 15 second timeout

    return () => {
      clearTimeout(timeoutId);
    };
  }, [changelogUrl]);

  const handleIframeLoad = () => {
    setTimeout(() => {
      isLoadingRef.current = false;
      setIsLoading(false);
    }, 1000);
  };

  const handleIframeError = () => {
    isLoadingRef.current = false;
    setHasError(true);
    setIsLoading(false);
  };

  if (config?.is_airgapped) {
    return (
      <ProductUpdatesFallback
        description="You’re using the airgapped version of Plane. Please visit our changelog to view the latest updates."
        variant="self-managed"
      />
    );
  }

  // Show fallback if URL is missing, empty, or iframe failed to load
  if (shouldShowFallback) {
    return (
      <ProductUpdatesFallback
        description="We're having trouble fetching the updates. Please visit our changelog to view the latest updates."
        variant={config?.is_self_managed ? "self-managed" : "cloud"}
      />
    );
  }

  return (
    <div className="flex flex-col h-[550px] overflow-hidden px-6 mx-0.5 relative">
      {isLoading && (
        <Loader className="flex flex-col gap-3 absolute inset-0 w-full h-full items-center justify-center">
          <Loader.Item height="95%" width="95%" />
        </Loader>
      )}
      <iframe
        src={changelogUrl}
        className={`w-full h-full ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </div>
  );
});
