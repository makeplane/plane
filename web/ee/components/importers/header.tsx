import Image from "next/image";
import { useTranslation } from "@plane/i18n";
import { TImporterConfig } from "./common/dashboard/base-dashboard";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
export interface IImporterHeaderProps<T> {
  config: Partial<TImporterConfig<T>>;
  actions?: React.ReactNode;
}
const ImporterHeader = <T,>(props: IImporterHeaderProps<T>) => {
  const { config, actions } = props;
  const { workspaceSlug } = useParams();
  const { serviceName, logo } = config;
  const { t } = useTranslation();
  return (
    <div className="relative flex flex-col justify-between w-full border-b border-custom-border-100 pb-3.5 gap-4">
      <Link
        href={`/${workspaceSlug}/settings/imports`}
        className="flex items-center gap-2 text-sm text-custom-text-300 font-semibold"
      >
        <ChevronLeft className="size-4" />
        <span>Back to Imports</span>
      </Link>
      <div className="flex justify-between w-full">
        <div className="relative flex gap-2 items-center">
          <Image src={logo} className="size-8" alt={`${serviceName} ${t("importers.logo")}`} />
          <div className="text-xl font-medium">{serviceName}</div>
        </div>
        {actions && actions}
      </div>
    </div>
  );
};

export default ImporterHeader;
