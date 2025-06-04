import { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { Info } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button, Tooltip } from "@plane/ui";
// plane web components
import { IntegrationProps } from "@/plane-web/components/integrations";
// plane web hooks
import { useFlag, useWorkspaceSubscription } from "@/plane-web/hooks/store";

export type IntegrationListItemProps = {
  provider: IntegrationProps;
  workspaceSlug: string;
  isSupported: boolean;
};

export const IntegrationListItem: FC<IntegrationListItemProps> = (props) => {
  const { provider, workspaceSlug, isSupported } = props;
  const isEnabled = useFlag(workspaceSlug, provider.flag);
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();

  const { t } = useTranslation();

  // derived values
  const isSelfManaged = subscriptionDetail?.is_self_managed;

  if (!isEnabled) return null;

  return (
    <div
      key={provider.key}
      className="flex flex-col max-w-[300px] justify-between gap-2 rounded-md border border-custom-border-100 bg-custom-background-100  px-4 py-6 flex-shrink-0"
    >
      <div className="relative h-12 w-12 flex-shrink-0 bg-custom-background-90 rounded flex items-center justify-center">
        <Image src={provider.logo} alt={`${provider.key} Logo`} width={32} height={32} />
      </div>

      <div className="relative flex items-center gap-2">
        <h3 className="flex items-center gap-4 text-sm font-medium">{t(`${provider.key}_integration.name`)}</h3>
        {provider.beta && (
          <div className="w-fit cursor-pointer rounded-2xl text-custom-primary-200 bg-custom-primary-100/20 text-center font-medium outline-none text-xs px-2">
            Beta
          </div>
        )}
      </div>
      <p className="text-sm tracking-tight text-custom-text-300">{t(`${provider.key}_integration.description`)}</p>

      {isSupported ? (
        <div className="flex-shrink-0">
          <Link href={`/${workspaceSlug}/settings/integrations/${provider.key}`}>
            <span>
              <Button variant="accent-primary" size="sm">
                {t("integrations.configure")}
              </Button>
            </span>
          </Link>
        </div>
      ) : (
        <Tooltip
          tooltipContent={
            isSelfManaged
              ? t("integrations.not_configured_message_admin", { name: provider.title })
              : t("integrations.not_configured_message_support", {
                  name: provider.title,
                })
          }
        >
          <div className="flex gap-1.5 cursor-help flex-shrink-0 items-center text-custom-text-200">
            <Info size={12} />
            <div className="text-xs">{t("integrations.not_configured")}</div>
          </div>
        </Tooltip>
      )}
    </div>
  );
};
