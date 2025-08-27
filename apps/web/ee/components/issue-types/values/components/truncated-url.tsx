import { ExternalLink } from "lucide-react";
import { cn, IURLComponents } from "@plane/utils";

interface TruncatedUrlProps {
  url: IURLComponents;
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
  const { pathname, full: fullURL } = url;
  const displayDomain = fullURL.hostname;
  const fullDisplayUrl = (pathname ?? "") + (fullURL.search ?? "") + (fullURL.hash ?? "");
  const shouldTruncate = fullDisplayUrl.length > maxPathLength;
  const truncatedDisplayUrl = shouldTruncate ? fullDisplayUrl.slice(0, maxPathLength) : fullDisplayUrl;

  return (
    <a
      href={url.full.href}
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
      {fullURL.pathname && fullURL.pathname.length > 0 && (
        <span className="text-sm">
          {truncatedDisplayUrl}
          {shouldTruncate && "..."}
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
