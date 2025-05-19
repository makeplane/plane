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
      className="flex items-center justify-between gap-2 border-b border-custom-border-100 bg-custom-background-100  px-4 py-6 flex-shrink-0"
    >
      <div className="flex items-start gap-4">
        <div className="relative h-10 w-10 flex-shrink-0">
          <Image src={provider.logo} layout="fill" objectFit="cover" alt={`${provider.title} Logo`} />
        </div>
        <div>
          <div className="relative flex items-center gap-2">
            <h3 className="flex items-center gap-4 text-sm font-medium">{provider.title}</h3>
            {provider.beta && (
              <div className="w-fit cursor-pointer rounded-2xl text-custom-primary-200 bg-custom-primary-100/20 text-center font-medium outline-none text-xs px-2">
                {t("common.beta")}
              </div>
            )}
          </div>
          <p className="text-sm tracking-tight text-custom-text-200">{t(provider.i18n_description)}</p>
        </div>
      </div>
      <div className="flex-shrink-0">
        <Link href={`/${workspaceSlug}/settings/imports/${provider.key}`}>
          <span>
            <Button variant="primary">{t("importers.import")}</Button>
          </span>
        </Link>
      </div>
    </div>
  );
};
