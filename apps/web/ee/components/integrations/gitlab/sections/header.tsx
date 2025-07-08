import Image from "next/image";

import { useTranslation } from "@plane/i18n";
import GitlabLogo from "@/public/services/gitlab.svg";

export const GitlabHeader = () => {
  // hooks
  const { t } = useTranslation();

  return (
    <div className="flex-shrink-0 relative flex items-center gap-4 rounded bg-custom-background-90/50 p-4">
      <div className="flex-shrink-0 w-10 h-10 relative flex justify-center items-center overflow-hidden">
        <Image src={GitlabLogo} layout="fill" objectFit="contain" alt="Gitlab Logo" />
      </div>
      <div>
        <div className="text-lg font-medium">{t("gitlab_integration.name")}</div>
        <div className="text-sm text-custom-text-200">{t("gitlab_integration.description")}</div>
      </div>
    </div>
  );
};
