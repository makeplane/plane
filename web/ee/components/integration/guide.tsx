"use client";

import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@plane/ui";
// hooks
import { useInstance, useWorkspace } from "@/hooks/store";
import SiloIframe from "@/plane-web/components/iframe/silo-iframe";
// constants
import { IMPORTERS_LIST } from "@/plane-web/constants/workspace";

const IntegrationGuide = observer(() => {
  const { currentWorkspace } = useWorkspace();

  // router
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider");

  const { config } = useInstance();
  return (
    <>
      {(!provider || provider === "csv") && (
        <>
          {IMPORTERS_LIST.map((service) => (
            <div
              key={service.provider}
              className="flex items-center justify-between gap-2 border-b border-custom-border-100 bg-custom-background-100  px-4 py-6 flex-shrink-0"
            >
              <div className="flex items-start gap-4">
                <div className="relative h-10 w-10 flex-shrink-0">
                  <Image src={service.logo} layout="fill" objectFit="cover" alt={`${service.title} Logo`} />
                </div>
                <div>
                  <h3 className="flex items-center gap-4 text-sm font-medium">{service.title}</h3>
                  <p className="text-sm tracking-tight text-custom-text-200">{service.description}</p>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Link href={`/${workspaceSlug}/settings/imports/${service.provider}`}>
                  <span>
                    <Button variant="primary">{service.type}</Button>
                  </span>
                </Link>
              </div>
            </div>
          ))}
          {currentWorkspace && currentWorkspace.id && (
            <SiloIframe srcBase={`${config?.silo_base_url}?view=dashboard`} />
          )}
        </>
      )}
    </>
  );
});

export default IntegrationGuide;
