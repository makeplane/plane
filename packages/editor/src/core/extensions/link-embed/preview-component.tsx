import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

export const LinkEmbedPreview = ({ node }: NodeViewProps) => {
  const { url, title, description, image, favicon } = node.attrs;

  return (
    <NodeViewWrapper className="link-embed-preview">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex max-w-full rounded-lg border border-custom-border-300 mb-2
                   bg-custom-background-100 hover:bg-custom-background-90 transition
                   no-underline hover:no-underline [&_*]:no-underline"
      >
        {/* LEFT IMAGE – FULL HEIGHT */}
        {image && (
          <div className="w-52 h-32 flex-shrink-0">
            <img src={image} alt={title || "Preview"} className="w-full h-full object-cover rounded-l-lg" />
          </div>
        )}

        {/* RIGHT CONTENT */}
        <div className="flex flex-col justify-center gap-1 pl-2 min-w-0">
          {/* Title */}
          {title && <h3 className="text-sm font-semibold text-custom-text-100 truncate">{title}</h3>}

          {/* Description */}
          {description && (
            <p
              className="text-xs text-custom-text-300"
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

          {/* URL */}
          <div className="flex items-center gap-1 text-xs text-custom-text-400 mt-1">
            {favicon && (
              <img
                src={favicon}
                alt=""
                className="w-4 h-4"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            <span className="truncate">{url}</span>
          </div>
        </div>
      </a>
    </NodeViewWrapper>
  );
};
