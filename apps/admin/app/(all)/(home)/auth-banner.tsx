import { Info } from "lucide-react";
// plane constants
import type { TAdminAuthErrorInfo } from "@plane/constants";
// icons
import { CloseIcon } from "@plane/propel/icons";

type TAuthBanner = {
  bannerData: TAdminAuthErrorInfo | undefined;
  handleBannerData?: (bannerData: TAdminAuthErrorInfo | undefined) => void;
};

export function AuthBanner(props: TAuthBanner) {
  const { bannerData, handleBannerData } = props;

  if (!bannerData) return <></>;
  return (
    <div className="relative flex items-center p-2 rounded-md gap-2 border border-accent-strong/50 bg-accent-primary/10">
      <div className="w-4 h-4 flex-shrink-0 relative flex justify-center items-center">
        <Info size={16} className="text-accent-primary" />
      </div>
      <div className="w-full text-13 font-medium text-accent-primary">{bannerData?.message}</div>
      <div
        className="relative ml-auto w-6 h-6 rounded-xs flex justify-center items-center transition-all cursor-pointer hover:bg-accent-primary/20 text-accent-primary"
        onClick={() => handleBannerData && handleBannerData(undefined)}
      >
        <CloseIcon className="w-4 h-4 flex-shrink-0" />
      </div>
    </div>
  );
}
