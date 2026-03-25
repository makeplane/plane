/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react";
// hooks
import { Loader } from "@plane/ui";
import { ProductUpdatesFallback } from "@/components/global/product-updates/fallback";
import { useInstance } from "@/hooks/store/use-instance";

export const ProductUpdatesChangelog = observer(function ProductUpdatesChangelog() {
  // refs
  const isLoadingRef = useRef(true);
  // states
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  // store hooks
  const { config } = useInstance();
  // derived values
  const changeLogUrl = config?.instance_changelog_url;
  const shouldShowFallback = !changeLogUrl || changeLogUrl === "" || hasError;

  // timeout fallback - if iframe doesn't load within 15 seconds, show error
  useEffect(() => {
    if (!changeLogUrl || changeLogUrl === "") {
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
  }, [changeLogUrl]);

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
    <div className="vertical-scrollbar relative mx-0.5 flex scrollbar-xs h-[550px] flex-col overflow-hidden overflow-y-scroll px-6">
      {isLoading && (
        <Loader className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-3">
          <Loader.Item height="95%" width="95%" />
        </Loader>
      )}
      <iframe
        src={changeLogUrl}
        className={`h-full w-full ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </div>
  );
});
