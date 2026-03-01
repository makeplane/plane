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

import React, { useState, useEffect, memo, useCallback, useMemo } from "react";
// plane imports
import type { ExternalEmbedNodeViewProps, TExternalEmbedBlockAttributes } from "@plane/editor";
import { EExternalEmbedAttributeNames, EExternalEmbedEntityType } from "@plane/editor";
// plane types
import type { IframelyResponse } from "@plane/types";
// plane ui
import { CrossOriginLoader, HTMLContent, InViewportRenderer, TwitterEmbed } from "@plane/ui";
// plane constants
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
// helpers
import { callNative } from "@/helpers/flutter-callback.helper";
// components
import { EmbedLoading } from "./components/embed-loading";
import { ErrorState } from "./components/error-state";
import { RichCard } from "./components/rich-card";

// Types
type ErrorData = {
  error: string;
  code: string;
};

type EmbedData = IframelyResponse | ErrorData | null;

const isErrorData = (value: unknown): value is ErrorData =>
  typeof value === "object" &&
  value !== null &&
  "error" in value &&
  typeof (value as { error?: unknown }).error === "string" &&
  "code" in value &&
  typeof (value as { code?: unknown }).code === "string";

const isIframelyData = (value: unknown): value is IframelyResponse =>
  typeof value === "object" && value !== null && !isErrorData(value);

const parseEmbedData = (value: string): EmbedData => {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (isErrorData(parsed) || isIframelyData(parsed)) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
};

const useEmbedDataManager = (externalEmbedNodeView: ExternalEmbedNodeViewProps) => {
  // state
  const [iframelyData, setIframelyData] = useState<EmbedData>(null);
  const [error, setError] = useState<ErrorData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // attributes
  const { src, [EExternalEmbedAttributeNames.EMBED_DATA]: storedEmbedData } = externalEmbedNodeView.node.attrs;
  const isThemeDark = useMemo(() => document.documentElement.getAttribute("data-theme") === "dark", []);
  // derived values
  const shouldFetch = src && !storedEmbedData;

  useEffect(() => {
    const fetchEmbedData = async () => {
      const errorData = {
        error: "Failed to fetch embed data",
        code: "FETCH_ERROR",
      };

      try {
        const data = await callNative<string>(CallbackHandlerStrings.fetchExternalEmbed, src || "");
        if (!data) {
          setError(errorData);
          setIframelyData(errorData);
          return;
        }
        const parsedData = parseEmbedData(data);
        if (!parsedData) {
          setError(errorData);
          setIframelyData(errorData);
          return;
        }
        setIframelyData(parsedData);
      } catch {
        setError(errorData);
        setIframelyData(errorData);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchEmbedData();
  }, [src, shouldFetch]);

  // Single useEffect for all attribute updates
  useEffect(() => {
    const updates: Partial<TExternalEmbedBlockAttributes> = {};

    // Handle successful data fetch - ensure it's not ErrorData and not null
    if (iframelyData && !("error" in iframelyData && "code" in iframelyData)) {
      updates[EExternalEmbedAttributeNames.EMBED_DATA] = JSON.stringify(iframelyData);
      if (iframelyData.meta?.site) {
        updates[EExternalEmbedAttributeNames.ENTITY_NAME] = iframelyData.meta.site;
      }
    }

    // Handle error state
    if (error) {
      const errorData = error as {
        response?: { data?: { error?: string; code?: string } };
        message?: string;
      };
      const defaultError = {
        error: errorData?.response?.data?.error || errorData?.message || "Failed to load embed",
        code: errorData?.response?.data?.code || "UNKNOWN_ERROR",
      };
      updates[EExternalEmbedAttributeNames.EMBED_DATA] = JSON.stringify(defaultError);
    }

    // Batch all updates in one call
    if (Object.keys(updates).length > 0) {
      externalEmbedNodeView.updateAttributes(updates);
    }
  }, [src, iframelyData, error, externalEmbedNodeView]);

  // Parse and return current embed data
  const currentEmbedData: EmbedData = useMemo(() => {
    if (storedEmbedData) {
      return parseEmbedData(storedEmbedData);
    }
    return iframelyData || null;
  }, [storedEmbedData, iframelyData]);

  // Handle Twitter theme updates
  useTwitterThemeHandler({
    storedEmbedData: storedEmbedData || null,
    isThemeDark,
    updateAttributes: externalEmbedNodeView.updateAttributes,
  });

  return {
    isLoading,
    currentEmbedData,
    isThemeDark,
    updateAttributes: externalEmbedNodeView.updateAttributes,
  };
};

// React State Family - Handles component state and interactions
const useEmbedState = (externalEmbedNodeView: ExternalEmbedNodeViewProps) => {
  const embedAttrs = externalEmbedNodeView.node.attrs;

  const [directEmbedState, setDirectEmbedState] = useState({
    hasTriedEmbedding: embedAttrs[EExternalEmbedAttributeNames.HAS_TRIED_EMBEDDING],
    isEmbeddable: !embedAttrs[EExternalEmbedAttributeNames.HAS_EMBED_FAILED],
  });

  const {
    src,
    [EExternalEmbedAttributeNames.IS_RICH_CARD]: isRichCardView,
    [EExternalEmbedAttributeNames.HAS_EMBED_FAILED]: isEmbedFailed,
  } = embedAttrs;

  const handleDirectEmbedLoaded = useCallback(() => {
    setDirectEmbedState({ hasTriedEmbedding: true, isEmbeddable: true });
    externalEmbedNodeView.updateAttributes({
      [EExternalEmbedAttributeNames.HAS_EMBED_FAILED]: false,
      [EExternalEmbedAttributeNames.HAS_TRIED_EMBEDDING]: true,
    });
  }, [externalEmbedNodeView]);

  const handleDirectEmbedError = useCallback(() => {
    setDirectEmbedState({ hasTriedEmbedding: true, isEmbeddable: false });
    externalEmbedNodeView.updateAttributes({
      [EExternalEmbedAttributeNames.HAS_EMBED_FAILED]: true,
      [EExternalEmbedAttributeNames.HAS_TRIED_EMBEDDING]: true,
      [EExternalEmbedAttributeNames.IS_RICH_CARD]: true,
      [EExternalEmbedAttributeNames.ENTITY_TYPE]: EExternalEmbedEntityType.RICH_CARD,
    });
  }, [externalEmbedNodeView]);

  return {
    directEmbedState,
    src: src,
    isRichCardView: isRichCardView,
    isEmbedFailed: isEmbedFailed,
    handleDirectEmbedLoaded,
    handleDirectEmbedError,
  };
};

// Pure JSX Renderer Family - Clean JSX rendering without complex logic
const EmbedRenderer: React.FC<{
  isLoading: boolean;
  currentEmbedData: EmbedData;
  isThemeDark: boolean;
  src: string;
  isRichCardView: boolean;
  directEmbedState: { hasTriedEmbedding: boolean; isEmbeddable: boolean };
  isEmbedFailed: boolean;
  handleDirectEmbedLoaded: () => void;
  handleDirectEmbedError: () => void;
}> = ({
  isLoading,
  currentEmbedData,
  isThemeDark,
  src,
  isRichCardView,
  directEmbedState,
  isEmbedFailed,
  handleDirectEmbedLoaded,
  handleDirectEmbedError,
}) => {
  const theme = isThemeDark ? "dark" : "light";

  // Determine if we should show loading animations based on whether we have data
  const showLoading = !currentEmbedData;

  // Loading state
  if (isLoading && !currentEmbedData) {
    return <EmbedLoading showLoading={showLoading} href={src} />;
  }

  // From here we know it's IframelyResponse
  const embedData = currentEmbedData as IframelyResponse;

  // Direct embed attempts (no HTML and not rich card)
  if (!embedData?.html && !isRichCardView) {
    // Success case - show direct iframe
    if (directEmbedState.hasTriedEmbedding && directEmbedState.isEmbeddable && !isEmbedFailed && !currentEmbedData) {
      return (
        <div className="w-full h-[400px] rounded overflow-hidden my-4">
          <iframe
            src={src}
            width="100%"
            height="100%"
            allowFullScreen
            className="bg-custom-background-90"
            title="Direct embed"
          />
        </div>
      );
    }

    // Testing phase - try to load directly
    if (!directEmbedState.hasTriedEmbedding) {
      return (
        <>
          <div className="w-0 h-0 overflow-hidden">
            <CrossOriginLoader src={src} onLoaded={handleDirectEmbedLoaded} onError={handleDirectEmbedError} />
          </div>
          <EmbedLoading href={src} />
        </>
      );
    }
  }

  // Error state
  if (currentEmbedData && "error" in currentEmbedData && "code" in currentEmbedData) {
    const errorData = currentEmbedData as ErrorData;
    return <ErrorState error={errorData.error} href={src} code={errorData.code} theme={theme} />;
  }

  // Rich card rendering
  if ((!embedData?.html && embedData?.meta) || (isRichCardView && embedData?.meta)) {
    return <RichCard iframelyData={embedData} src={src} theme={theme} showLoading={showLoading} />;
  }

  // HTML content rendering
  if (embedData?.html && !isRichCardView) {
    const hasIframe = embedData.html.includes("<iframe");
    return hasIframe ? (
      <HTMLContent html={embedData.html} showLoading={showLoading} />
    ) : (
      <TwitterEmbed iframelyData={embedData} />
    );
  }
};

// Main Entry Component - Simple orchestration
export const EmbedHandler: React.FC<ExternalEmbedNodeViewProps> = memo((props) => {
  const hasEmbedData = props.node.attrs[EExternalEmbedAttributeNames.EMBED_DATA];

  return (
    <InViewportRenderer placeholder={<EmbedLoading showLoading={!hasEmbedData} href={props.node.attrs.src} />}>
      <EmbedHandlerRender {...props} />
    </InViewportRenderer>
  );
});
EmbedHandler.displayName = "EmbedHandler";

// Main Component - Clean orchestration of families
const EmbedHandlerRender: React.FC<ExternalEmbedNodeViewProps> = (externalEmbedNodeView) => {
  // Data Management Family
  const { isLoading, currentEmbedData, isThemeDark } = useEmbedDataManager(externalEmbedNodeView);

  // React State Family
  const { directEmbedState, src, isRichCardView, isEmbedFailed, handleDirectEmbedLoaded, handleDirectEmbedError } =
    useEmbedState(externalEmbedNodeView);

  const { id } = externalEmbedNodeView.node.attrs;

  return (
    <div key={id} className="embed-handler-wrapper">
      <EmbedRenderer
        isLoading={isLoading}
        currentEmbedData={currentEmbedData}
        isThemeDark={isThemeDark}
        src={src as string}
        isRichCardView={isRichCardView}
        directEmbedState={directEmbedState}
        isEmbedFailed={isEmbedFailed}
        handleDirectEmbedLoaded={handleDirectEmbedLoaded}
        handleDirectEmbedError={handleDirectEmbedError}
      />
    </div>
  );
};

type UseTwitterThemeHandlerProps = {
  storedEmbedData: string | null;
  isThemeDark: boolean | undefined;
  updateAttributes: (attrs: { [EExternalEmbedAttributeNames.EMBED_DATA]: string }) => void;
};
const useTwitterThemeHandler = ({ storedEmbedData, isThemeDark, updateAttributes }: UseTwitterThemeHandlerProps) => {
  useEffect(() => {
    if (!storedEmbedData) return;
    try {
      const parsedData = parseEmbedData(storedEmbedData);
      if (!isIframelyData(parsedData) || typeof parsedData.html !== "string") return;

      // Only proceed if we have Twitter embed HTML
      if (parsedData.html.includes("twitter-tweet")) {
        let updatedHtml = parsedData.html;
        // Update theme based on current theme setting
        if (isThemeDark) {
          if (updatedHtml.includes('data-theme="light"')) {
            updatedHtml = updatedHtml.replace('data-theme="light"', 'data-theme="dark"');
          } else if (!updatedHtml.includes('data-theme="dark"')) {
            updatedHtml = updatedHtml.replace("twitter-tweet", 'twitter-tweet data-theme="dark"');
          }
        } else {
          if (updatedHtml.includes('data-theme="dark"')) {
            updatedHtml = updatedHtml.replace('data-theme="dark"', 'data-theme="light"');
          } else if (!updatedHtml.includes('data-theme="light"')) {
            updatedHtml = updatedHtml.replace("twitter-tweet", 'twitter-tweet data-theme="light"');
          }
        }

        // Only update if there were changes
        if (updatedHtml !== parsedData.html) {
          const updatedData = { ...parsedData, html: updatedHtml };
          updateAttributes({ [EExternalEmbedAttributeNames.EMBED_DATA]: JSON.stringify(updatedData) });
        }
      }
    } catch (error) {
      console.error("Error updating Twitter theme:", error);
    }
  }, [isThemeDark, storedEmbedData, updateAttributes]); // Removed updateAttributes to prevent infinite loop
};
