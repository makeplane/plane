import Image from "next/image";
import { useTranslation } from "@plane/i18n";
import { TImporterConfig } from "./common/dashboard/base-dashboard";
export interface IImporterHeaderProps<T> {
  config: Partial<TImporterConfig<T>>;
  actions?: React.ReactNode;
  description?: string;
}
const ImporterHeader = <T,>(props: IImporterHeaderProps<T>) => {
  const { config, actions, description } = props;
  const { serviceName, logo } = config;
  const { t } = useTranslation();
  return (
    <div className="relative flex flex-col justify-between w-full border-b border-custom-border-100 pb-3.5 gap-4">
      <div className="flex justify-between w-full">
        <div className="relative flex gap-3">
          <Image src={logo} className="size-8" alt={`${serviceName} ${t("importers.logo")}`} />
          <div className="flex flex-col gap-1">
            <div className="text-xl font-medium my-auto">{serviceName}</div>
            {description && <div className="text-sm text-custom-text-200">{description}</div>}
          </div>
        </div>
        {actions && actions}
      </div>
    </div>
  );
};

export default ImporterHeader;
