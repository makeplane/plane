"use client";

import React, { useState, useEffect, memo, useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
// plane imports
import {
  EExternalEmbedAttributeNames,
  EExternalEmbedEntityType,
  ExternalEmbedNodeViewProps,
  TExternalEmbedBlockAttributes,
} from "@plane/editor";
import type { IframelyResponse } from "@plane/types";
import CrossOriginLoader from "@plane/ui/src/editor/cross-origin-loader";
import { EmbedLoading } from "@plane/ui/src/editor/embed-loading";
import { ErrorState } from "@plane/ui/src/editor/error-state";
import { HTMLContent } from "@plane/ui/src/editor/html-content";
import { InViewportRenderer } from "@plane/ui/src/editor/is-in-viewport";
import { RichCard } from "@plane/ui/src/editor/rich-card";
import { TwitterEmbed } from "@plane/ui/src/editor/twitter-embed";
// local hooks
import { useUser } from "@/hooks/store/user";
// plane web services
import { iframelyService } from "@/plane-web/services/iframely.service";

// Types
type ErrorData = {
  error: string;
  code: string;
};

type EmbedData = IframelyResponse | ErrorData | null;

const useEmbedDataManager = (externalEmbedNodeView: ExternalEmbedNodeViewProps) => {
  // attributes
  const { src, embed_data: storedEmbedData } = externalEmbedNodeView.node.attrs;
  // derived values
  const { resolvedTheme } = useTheme();
  const { workspaceSlug } = useParams();
  const { data: currentUser } = useUser();
  const isThemeDark = resolvedTheme?.startsWith("dark") ?? false;
  const userId = currentUser?.id;

  // SWR for fetching embed data
  const shouldFetch = src && !storedEmbedData;
  const swrKey = shouldFetch ? [src, isThemeDark, workspaceSlug.toString(), userId || ""] : null;

  const {
    data: iframelyData,
    error,
    isLoading,
  } = useSWR(
    swrKey,
    ([src, isThemeDark, workspaceSlug, userId]: [string, boolean, string, string]) =>
      iframelyService.getEmbedData(src, isThemeDark, workspaceSlug, userId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000,
    }
  );

  // Single useEffect for all attribute updates
  useEffect(() => {
    const updates: Partial<TExternalEmbedBlockAttributes> = {};

    // Handle successful data fetch
    if (iframelyData) {
      updates[EExternalEmbedAttributeNames.EMBED_DATA] = JSON.stringify(iframelyData);
      if (iframelyData?.meta?.site) {
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
      try {
        return JSON.parse(storedEmbedData);
      } catch {}
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

  const { src, is_rich_card, has_embed_failed } = embedAttrs;

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
    isRichCardView: is_rich_card,
    isEmbedFailed: has_embed_failed,
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
    return <EmbedLoading showLoading={showLoading} />;
  }

  // From here we know it's IframelyResponse
  const embedData = currentEmbedData as IframelyResponse;

  // Direct embed attempts (no HTML and not rich card)
  if (!embedData?.html && !isRichCardView) {
    // Success case - show direct iframe
    if (directEmbedState.hasTriedEmbedding && directEmbedState.isEmbeddable && !isEmbedFailed) {
      return (
        <div className="w-full h-[400px] rounded overflow-hidden my-4">
          <iframe src={src} width="100%" height="100%" frameBorder="0" allowFullScreen />
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
          <EmbedLoading />
        </>
      );
    }
  }
  // Error state
  if (currentEmbedData && "error" in currentEmbedData && "code" in currentEmbedData) {
    const errorData = currentEmbedData as ErrorData;
    return <ErrorState error={errorData.error} code={errorData.code} theme={theme} />;
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
export const EmbedHandler: React.FC<ExternalEmbedNodeViewProps> = memo(
  observer((props) => {
    const hasEmbedData = props.node.attrs.embed_data;

    return (
      <InViewportRenderer placeholder={<EmbedLoading showLoading={!hasEmbedData} />}>
        <EmbedHandlerRender {...props} />
      </InViewportRenderer>
    );
  })
);

// Main Component - Clean orchestration of families
const EmbedHandlerRender: React.FC<ExternalEmbedNodeViewProps> = observer((externalEmbedNodeView) => {
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
});

type UseTwitterThemeHandlerProps = {
  storedEmbedData: string | null;
  isThemeDark: boolean | undefined;
  updateAttributes: (attrs: { embed_data: string }) => void;
};
const useTwitterThemeHandler = ({ storedEmbedData, isThemeDark, updateAttributes }: UseTwitterThemeHandlerProps) => {
  useEffect(() => {
    if (!storedEmbedData) return;

    try {
      const parsedData = JSON.parse(storedEmbedData);

      // Only proceed if we have Twitter embed HTML
      if (parsedData.html && parsedData.html.includes("twitter-tweet")) {
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
          updateAttributes({ embed_data: JSON.stringify(updatedData) });
        }
      }
    } catch (error) {
      console.error("Error updating Twitter theme:", error);
    }
  }, [isThemeDark, storedEmbedData, updateAttributes]);
};
