import { FC } from "react";
import { Info, X } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// helpers
import { TAuthErrorInfo } from "@/helpers/authentication.helper";

type TAuthBanner = {
  bannerData: TAuthErrorInfo | undefined;
  handleBannerData?: (bannerData: TAuthErrorInfo | undefined) => void;
};

export const AuthBanner: FC<TAuthBanner> = (props) => {
  const { bannerData, handleBannerData } = props;
  // translation
  const { t } = useTranslation();

  if (!bannerData) return <></>;

  return (
    <div
      role="alert"
      className="relative flex items-center p-2 rounded-md gap-2 border border-custom-primary-100/50 bg-custom-primary-100/10"
    >
      <div className="size-4 flex-shrink-0 grid place-items-center">
        <Info size={16} className="text-custom-primary-100" />
      </div>
      <p className="w-full text-sm font-medium text-custom-primary-100">{bannerData?.message}</p>
      <button
        type="button"
        className="relative ml-auto size-6 rounded-sm grid place-items-center transition-all hover:bg-custom-primary-100/20 text-custom-primary-100/80"
        onClick={() => handleBannerData?.(undefined)}
        aria-label={t("aria_labels.auth_forms.close_alert")}
      >
        <X className="size-4" />
      </button>
    </div>
  );
};
