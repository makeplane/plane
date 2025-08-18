import { ExternalLink } from "lucide-react";
import React from "react";
import { cn, parseURL } from "@plane/utils";

interface TruncatedUrlProps {
  url: string;
  maxPathLength?: number;
  className?: string;
  showLinkIcon?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

const MAX_PATH_LENGTH = 15;

export const TruncatedUrl: React.FC<TruncatedUrlProps> = ({
  url,
  maxPathLength = MAX_PATH_LENGTH,
  className = "",
  showLinkIcon = false,
  onClick,
}) => {
  const parsedUrl = parseURL(url);
  if (!parsedUrl) return null;

  const { full, path } = parsedUrl;
  const displayDomain = full.domain;
  const isTruncated = path.length > maxPathLength;
  const truncatedPath = isTruncated ? path.slice(0, maxPathLength) : path;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center decoration-[0.5px] underline underline-offset-2 text-custom-text-500",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      <span className="text-sm">{displayDomain}</span>
      {path && (
        <span className="text-sm">
          /{truncatedPath}
          {isTruncated && "..."}
        </span>
      )}
      {showLinkIcon && (
        <span className="ml-1 inline-block">
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
        </span>
      )}
    </a>
  );
};
