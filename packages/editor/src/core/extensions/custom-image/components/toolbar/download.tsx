import { Download } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/ui";

type Props = {
  src: string;
};

export function ImageDownloadAction(props: Props) {
  const { src } = props;

  return (
    <Tooltip tooltipContent="Download">
      <button
        type="button"
        onClick={() => window.open(src, "_blank")}
        className="flex-shrink-0 h-full grid place-items-center text-on-color/60 hover:text-on-color transition-colors"
        aria-label="Download image"
      >
        <Download className="size-3" />
      </button>
    </Tooltip>
  );
}
