import React, { memo } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane editor
import { EExternalEmbedAttributeNames, EExternalEmbedEntityType, ExternalEmbedNodeViewProps } from "@plane/editor";
// plane types
import { IframelyResponse } from "@plane/types";
// plane components
import { EmbedLoading } from "@plane/ui/src/editor/embed-loading";
import { ErrorState } from "@plane/ui/src/editor/error-state";
import { HTMLContent } from "@plane/ui/src/editor/html-content";
import { InViewportRenderer } from "@plane/ui/src/editor/is-in-viewport";
import { RichCard } from "@plane/ui/src/editor/rich-card";
import { TwitterEmbed } from "@plane/ui/src/editor/twitter-embed";

// Main wrapper component that uses lazy loading through InViewportRenderer
export const EmbedHandler: React.FC<ExternalEmbedNodeViewProps> = memo(
  observer((props) => (
    <InViewportRenderer placeholder={<EmbedLoading />}>
      <EmbedHandlerRender {...props} />
    </InViewportRenderer>
  ))
);

const EmbedHandlerRender: React.FC<ExternalEmbedNodeViewProps> = observer((props) => {
  const { node } = props;
  const {
    src,
    [EExternalEmbedAttributeNames.EMBED_DATA]: storedEmbedData,
    [EExternalEmbedAttributeNames.IS_RICH_CARD]: isRichCardView,
    [EExternalEmbedAttributeNames.HAS_EMBED_FAILED]: isEmbedFailed,
  } = node.attrs;
  // dervied values
  const { resolvedTheme } = useTheme();
  const isThemeDark = resolvedTheme?.startsWith("dark");
  const theme = isThemeDark ? "dark" : "light";

  // Parse embed data from node attributes
  const embedData = React.useMemo(() => {
    if (!storedEmbedData) return null;
    try {
      return JSON.parse(storedEmbedData) as IframelyResponse;
    } catch {
      return null;
    }
  }, [storedEmbedData]);

  // Handle error states first
  if (!src) {
    return <ErrorState error="No URL provided" code="400" theme={theme} />;
  }

  if (embedData?.error && embedData?.code) {
    return <ErrorState error={embedData.error} code={embedData.code} theme={theme} />;
  }

  if (src && !embedData) {
    return <ErrorState error="No embed data available" code="404" theme={theme} />;
  }

  // Handle direct iframe embed
  if (!embedData?.html && [EExternalEmbedEntityType.EMBED] && !isEmbedFailed && !isRichCardView && src) {
    return (
      <div className="w-full h-[400px] rounded overflow-hidden my-4">
        <iframe src={src} width="100%" height="100%" frameBorder="0" allowFullScreen />
      </div>
    );
  }

  // Handle rich card
  if (embedData?.meta && (isRichCardView || !embedData.html) && src) {
    return <RichCard iframelyData={embedData} src={src} theme={theme} />;
  }

  // Handle HTML content (including Twitter embeds)
  if (embedData?.html && !isRichCardView) {
    return embedData.html.includes("<iframe") ? (
      <HTMLContent html={embedData.html} />
    ) : (
      <TwitterEmbed iframelyData={embedData} />
    );
  }

  return null;
});
