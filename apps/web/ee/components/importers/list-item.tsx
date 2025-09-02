import { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@plane/i18n";
import { Button, BetaBadge } from "@plane/ui";
// plane web components
import { ImporterProps } from "@/plane-web/components/importers";
import { useFlag } from "@/plane-web/hooks/store";

export type ImportersListItemProps = {
  provider: ImporterProps;
  workspaceSlug: string;
};

export const ImportersListItem: FC<ImportersListItemProps> = (props) => {
  const { provider, workspaceSlug } = props;

  const { t } = useTranslation();

  const isFeatureEnabled = useFlag(workspaceSlug, provider.flag);
  const importerUnderFlags = ["clickup", "notion"];

  if (!isFeatureEnabled && importerUnderFlags.includes(provider.key)) {
    return null;
  }

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
        {provider.beta && <BetaBadge />}
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
