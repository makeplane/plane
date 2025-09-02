import { Download } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/ui";

type Props = {
  src: string;
};

export const ImageDownloadAction: React.FC<Props> = (props) => {
  const { src } = props;

  return (
    <Tooltip tooltipContent="Download">
      <button
        type="button"
        onClick={() => window.open(src, "_blank")}
        className="flex-shrink-0 h-full grid place-items-center text-white/60 hover:text-white transition-colors"
        aria-label="Download image"
      >
        <Download className="size-3" />
      </button>
    </Tooltip>
  );
};
