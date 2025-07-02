import { useState } from "react";
import { observer } from "mobx-react";
import Image, { StaticImageData } from "next/image";
// ui
import { useTranslation } from "@plane/i18n";
import { Button, Loader } from "@plane/ui";

type TInstallationCardProps = {
  providerName: string;
  providerDescription: string;
  providerLogo: StaticImageData;
  isConnectionLoading: boolean;
  isAppConnected: boolean;
  handleInstallation: () => Promise<void>;
};

export const InstallationCard = observer((props: TInstallationCardProps) => {
  const { providerName, providerDescription, providerLogo, isConnectionLoading, isAppConnected, handleInstallation } =
    props;
  // states
  const [isAppInstalling, setIsAppInstalling] = useState(false);
  const { t } = useTranslation();

  const handleInstall = async () => {
    setIsAppInstalling(true);
    await handleInstallation();
    setIsAppInstalling(false);
  };

  return (
    <div className="flex-shrink-0 relative flex items-center gap-4 p-4 bg-custom-background-90 rounded-lg">
      <div className="flex-shrink-0 size-10 relative flex justify-center items-center overflow-hidden">
        <Image src={providerLogo} layout="fill" objectFit="contain" alt={`${providerName} Logo`} />
      </div>
      <div className="w-full h-full overflow-hidden">
        <div className="text-lg font-medium">{providerName}</div>
        <div className="text-sm text-custom-text-200">{providerDescription}</div>
      </div>
      <div className="flex-shrink-0 relative flex items-center gap-4">
        {isAppConnected ? (
          <div className="text-sm bg-green-500/20 text-green-600 px-3 py-1 rounded-md">{t("common.connected")}</div>
        ) : isConnectionLoading ? (
          <Loader className="flex items-center justify-center">
            <Loader.Item width="70px" height="30px" />
          </Loader>
        ) : (
          <Button onClick={handleInstall} loading={isAppInstalling}>
            {isAppInstalling ? t("common.installing") : t("common.install")}
          </Button>
        )}
      </div>
    </div>
  );
});
