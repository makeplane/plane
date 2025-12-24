import { AlertCircle } from "lucide-react";

type Props = {
  bannerName: string;
  description?: string;
};

export function IntegrationAndImportExportBanner({ bannerName, description }: Props) {
  return (
    <div className="flex items-start gap-3 border-b border-subtle py-3.5">
      <h3 className="text-18 font-medium">{bannerName}</h3>
      {description && (
        <div className="flex items-center gap-3 rounded-[10px] border border-accent-strong/75 bg-accent-primary/5 p-4 text-13 text-primary">
          <AlertCircle className="h-6 w-6 text-primary" />
          <p className="leading-5">{description}</p>
        </div>
      )}
    </div>
  );
}
