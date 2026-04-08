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

import React, { memo } from "react";
import { observer } from "mobx-react";
// plane imports
import type { ExternalEmbedNodeViewProps } from "@plane/editor";
import { EExternalEmbedAttributeNames } from "@plane/editor";
import type { IframelyResponse } from "@plane/types";
import {
  CrossOriginLoader,
  EmbedLoading,
  ErrorState,
  HTMLContent,
  InViewportRenderer,
  RichCard,
  TwitterEmbed,
} from "@plane/ui";
import { useEmbedDataManager } from "./use-embed-data-manager";
import { useEmbedState } from "./use-embed-state";

// Types
type ErrorData = {
  error: string;
  code: string;
};

export type EmbedData = IframelyResponse | ErrorData | null;

// Pure JSX Renderer Family - Clean JSX rendering without complex logic
function EmbedRenderer({
  isLoading,
  currentEmbedData,
  isThemeDark,
  src,
  isRichCardView,
  directEmbedState,
  isEmbedFailed,
  handleDirectEmbedLoaded,
  handleDirectEmbedError,
}: {
  isLoading: boolean;
  currentEmbedData: EmbedData;
  isThemeDark: boolean;
  src: string;
  isRichCardView: boolean;
  directEmbedState: { hasTriedEmbedding: boolean; isEmbeddable: boolean };
  isEmbedFailed: boolean;
  handleDirectEmbedLoaded: () => void;
  handleDirectEmbedError: () => void;
}) {
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
        <div className="w-full h-[400px] rounded-sm overflow-hidden my-4">
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
}

// Main Entry Component - Simple orchestration
export const EmbedHandler: React.FC<ExternalEmbedNodeViewProps> = memo(
  observer(function EmbedHandler(props) {
    const hasEmbedData = props.node.attrs[EExternalEmbedAttributeNames.EMBED_DATA];

    return (
      <InViewportRenderer placeholder={<EmbedLoading showLoading={!hasEmbedData} />}>
        <EmbedHandlerRender {...props} />
      </InViewportRenderer>
    );
  })
);
EmbedHandler.displayName = "EmbedHandler";

// Main Component - Clean orchestration of families
const EmbedHandlerRender = observer(function EmbedHandlerRender(externalEmbedNodeView: ExternalEmbedNodeViewProps) {
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
