import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

// Link Embed Preview Component
export const LinkEmbedPreview = ({ node }: NodeViewProps) => {
  const { url, title, description, image, favicon } = node.attrs;
  
  console.log('LinkEmbed attrs:', node.attrs);

  return (
    <NodeViewWrapper className="link-embed-preview">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block border border-custom-border-300 rounded-lg p-4 bg-custom-background-90 hover:bg-custom-background-80 transition-colors max-w-2xl"
      >
        <div className="flex gap-3">
          {favicon && (
            <div className="flex-shrink-0 mt-1">
              <img
                src={favicon}
                alt=""
                className="w-4 h-4 rounded"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              {image && (
                <div className="flex-shrink-0">
                  <img
                    src={image}
                    alt={title || "Preview image"}
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {title && <h3 className="text-sm font-medium text-custom-text-100 truncate mb-1">{title}</h3>}
                {description && (
                  <p
                    className="text-xs text-custom-text-300 mb-2"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {description}
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs text-custom-text-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <span className="truncate">{url}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>
    </NodeViewWrapper>
  );
};
