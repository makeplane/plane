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
      <a
        href={src}
        className="flex-shrink-0 h-full grid place-items-center text-white/60 hover:text-white transition-colors"
        target="_blank"
        rel="noreferrer noopener"
      >
        <Download className="size-3" />
      </a>
    </Tooltip>
  );
};
