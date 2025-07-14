// assets
import { useTranslation } from "@plane/i18n";
import packageJson from "package.json";

export const PlaneVersionNumber: React.FC = () => {
  const { t } = useTranslation();
  return (
    <span>
      {t("version")}: v{packageJson.version}
    </span>
  );
};
