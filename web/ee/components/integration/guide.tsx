"use client";

import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@plane/ui";
// constants
import { IMPORTERS_LIST } from "@/plane-web/constants/workspace";
// plane web hooks
import { useFlag } from "@/plane-web/hooks/store";

const IntegrationGuide = observer(() => {
  // router
  const { workspaceSlug } = useParams();

  return (
    <>
      {workspaceSlug &&
        IMPORTERS_LIST.map(
          (service) =>
            useFlag(workspaceSlug?.toString(), service.key) && (
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
            )
        )}
    </>
  );
});

export default IntegrationGuide;
