import { observer } from "mobx-react-lite";
import Image from "next/image";
import { FileText } from "lucide-react";
// ui
import { Logo } from "@plane/ui";
// plane web hooks
import { usePage } from "@/plane-web/hooks/store";
// assets
import planeLogo from "@/public/plane-logo.svg";

type Props = {
  anchor: string;
};

export const PageDetailsHeader: React.FC<Props> = observer((props) => {
  const { anchor } = props;
  // store hooks
  const pageDetails = usePage(anchor);

  if (!pageDetails) return null;

  return (
    <div className="sticky top-0 z-[1] px-5 py-3.5 bg-custom-background-90 border-b-[0.5px] border-custom-border-300 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="flex-shrink-0 size-6 rounded-sm bg-custom-background-80 grid place-items-center">
          {pageDetails.logo_props?.in_use ? (
            <Logo logo={pageDetails.logo_props} size={14} type="lucide" />
          ) : (
            <FileText className="size-3.5 text-custom-text-300" />
          )}
        </span>
        <p className="text-sm font-medium max-w-96 truncate">{pageDetails?.name}</p>
      </div>
      <a
        href="https://plane.so"
        className="flex items-center gap-1 rounded border border-custom-border-200 bg-custom-background-100 px-2 py-1 shadow-custom-shadow-2xs"
        target="_blank"
        rel="noreferrer noopener"
      >
        <div className="relative grid h-6 w-6 place-items-center">
          <Image src={planeLogo} alt="Plane logo" className="h-6 w-6" height="24" width="24" />
        </div>
        <div className="text-xs">
          Powered by <span className="font-semibold">Plane Deploy</span>
        </div>
      </a>
    </div>
  );
});
