import { FC } from "react";
import { Info, X } from "lucide-react";
// helpers
import { TAuthErrorInfo } from "@/helpers/authentication.helper";

type TAuthBanner = {
  bannerData: TAuthErrorInfo | undefined;
  handleBannerData?: (bannerData: TAuthErrorInfo | undefined) => void;
};

export const AuthBanner: FC<TAuthBanner> = (props) => {
  const { bannerData, handleBannerData } = props;

  if (!bannerData) return <></>;
  return (
    <div className="relative flex items-center p-2 rounded-md gap-2 border border-custom-primary-100/50 bg-custom-primary-100/10">
      <div className="w-4 h-4 flex-shrink-0 relative flex justify-center items-center">
        <Info size={16} className="text-custom-primary-100" />
      </div>
      <div className="w-full text-sm font-medium text-custom-primary-100">{bannerData?.message}</div>
      <div
        className="relative ml-auto w-6 h-6 rounded-sm flex justify-center items-center transition-all cursor-pointer hover:bg-custom-primary-100/20 text-custom-primary-100/80"
        onClick={() => handleBannerData && handleBannerData(undefined)}
      >
        <X className="w-4 h-4 flex-shrink-0" />
      </div>
    </div>
  );
};
