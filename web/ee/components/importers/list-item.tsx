import { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
// plane web components
import { ImporterProps } from "@/plane-web/components/importers";

export type ImportersListItemProps = {
  provider: ImporterProps;
  workspaceSlug: string;
};

export const ImportersListItem: FC<ImportersListItemProps> = (props) => {
  const { provider, workspaceSlug } = props;

  const { t } = useTranslation();

  return (
    <div
      key={provider.key}
      className="flex flex-col w-full md:w-[30%] justify-between gap-2 rounded-md border border-custom-border-100 bg-custom-background-100  px-4 py-6 flex-shrink-0 overflow-hidden"
    >
      <div className="relative h-12 w-12 flex-shrink-0 bg-custom-background-90 rounded flex items-center justify-center">
        <Image src={provider.logo} width={32} height={32} alt={`${provider.title} Logo`} />
      </div>
      <div className="relative flex items-center gap-2">
        <h3 className="flex items-center gap-4 text-sm font-medium">{provider.title}</h3>
        {provider.beta && (
          <div className="w-fit cursor-pointer rounded-2xl text-custom-primary-200 bg-custom-primary-100/20 text-center font-medium outline-none text-xs px-2">
            {t("common.beta")}
          </div>
        )}
      </div>
      <p className="text-sm tracking-tight text-custom-text-200 truncate">{t(provider.i18n_description)}</p>
      <div className="flex-shrink-0">
        <Link href={`/${workspaceSlug}/settings/imports/${provider.key}`}>
          <span>
            <Button size="sm" variant="accent-primary">
              {t("importers.import")}
            </Button>
          </span>
        </Link>
      </div>
    </div>
  );
};
