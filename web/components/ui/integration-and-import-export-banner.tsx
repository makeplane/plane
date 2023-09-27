import { ExclamationIcon } from "components/icons";

type Props = {
  bannerName: string;
  description?: string;
};

export const IntegrationAndImportExportBanner: React.FC<Props> = ({ bannerName, description }) => (
  <div className="flex items-start gap-3 py-3.5 border-b border-custom-border-200">
    <h3 className="text-xl font-medium">{bannerName}</h3>
    {description && (
      <div className="flex items-center gap-3 rounded-[10px] border border-custom-primary/75 bg-custom-primary/5 p-4 text-sm text-custom-text-100">
        <ExclamationIcon height={24} width={24} className="fill-current text-custom-text-100" />
        <p className="leading-5">{description}</p>
      </div>
    )}
  </div>
);
