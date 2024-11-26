import { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@plane/ui";
// plane web components
import { IntegrationProps } from "@/plane-web/components/integrations";
// plane web hooks
import { useFlag } from "@/plane-web/hooks/store";

export type IntegrationListItemProps = {
  provider: IntegrationProps;
  workspaceSlug: string;
};

export const IntegrationListItem: FC<IntegrationListItemProps> = (props) => {
  const { provider, workspaceSlug } = props;
  const isEnabled = useFlag(workspaceSlug, provider.flag);

  if (!isEnabled) return null;

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
                Beta
              </div>
            )}
          </div>
          <p className="text-sm tracking-tight text-custom-text-200">{provider.description}</p>
        </div>
      </div>
      <div className="flex-shrink-0">
        <Link href={`/${workspaceSlug}/settings/integrations/${provider.key}`}>
          <span>
            <Button variant="primary">Configure</Button>
          </span>
        </Link>
      </div>
    </div>
  );
};
