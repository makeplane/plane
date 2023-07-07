import { ExclamationIcon } from "components/icons";

type Props = {
  bannerName: string;
};

export const IntegrationAndImportExportBanner: React.FC<Props> = ({ bannerName }) => (
  <div className="flex flex-col items-start gap-3">
    <h3 className="text-2xl font-semibold">{bannerName}</h3>
    <div className="flex items-center gap-3 rounded-[10px] border border-brand-accent/75 bg-brand-accent/5 p-4 text-sm text-brand-base">
      <ExclamationIcon height={24} width={24} className="fill-current text-brand-base" />
      <p className="leading-5">
        Integrations and importers are only available on the cloud version. We plan to open-source
        our SDKs in the near future so that the community can request or contribute integrations as
        needed.
      </p>
    </div>
  </div>
);
