import { useState } from "react";
import Image from "next/image";
import { Video } from "lucide-react";
import { cn } from "@plane/utils";
import { buildCustomPlaylistThumbnailUrl } from "../../utils";

type Props = {
  className?: string;
  thumbnail?: string | null;
};

export const PlaylistClipThumbnail = ({ className, thumbnail }: Props) => {
  const [failedSource, setFailedSource] = useState("");
  const source = buildCustomPlaylistThumbnailUrl(thumbnail);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-panel)]",
        className
      )}
    >
      {source && failedSource !== source ? (
        <Image
          src={source}
          alt=""
          fill
          sizes="64px"
          className="object-cover"
          draggable={false}
          unoptimized
          onError={() => setFailedSource(source)}
        />
      ) : (
        <Video className="h-3 w-3 text-[var(--sg-matrix-text-muted)]" />
      )}
    </span>
  );
};
