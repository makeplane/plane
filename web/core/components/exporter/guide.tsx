"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import useSWR, { mutate } from "swr";
// icons
import { MoveLeft, MoveRight, RefreshCw } from "lucide-react";
// ui
import { Button } from "@plane/ui";
// components
import { EmptyState } from "@/components/empty-state";
import { Exporter, SingleExport } from "@/components/exporter";
import { ImportExportSettingsLoader } from "@/components/ui";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { EXPORT_SERVICES_LIST } from "@/constants/fetch-keys";
import { EXPORTERS_LIST } from "@/constants/workspace";
// hooks
import { useUser } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// services
import { IntegrationService } from "@/services/integrations";

const integrationService = new IntegrationService();

const IntegrationGuide = observer(() => {
  // states
  const [refreshing, setRefreshing] = useState(false);
  const per_page = 10;
  const [cursor, setCursor] = useState<string | undefined>(`10:0:0`);
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider");
  // store hooks
  const { data: currentUser } = useUser();

  const { data: exporterServices } = useSWR(
    workspaceSlug && cursor ? EXPORT_SERVICES_LIST(workspaceSlug as string, cursor, `${per_page}`) : null,
    workspaceSlug && cursor
      ? () => integrationService.getExportsServicesList(workspaceSlug as string, cursor, per_page)
      : null
  );

  const handleCsvClose = () => {
    router.replace(`/${workspaceSlug?.toString()}/settings/exports`);
  };

  return (
    <>
      <div className="h-full w-full">
        <>
          <div>
            {EXPORTERS_LIST.map((service) => (
              <div
                key={service.provider}
                className="flex items-center justify-between gap-2 border-b border-custom-border-100 bg-custom-background-100 px-4 py-6"
              >
                <div className="flex w-full items-start justify-between gap-4">
                  <div className="item-center flex gap-2.5">
                    <div className="relative h-10 w-10 flex-shrink-0">
                      <Image src={service.logo} layout="fill" objectFit="cover" alt={`${service.title} Logo`} />
                    </div>
                    <div>
                      <h3 className="flex items-center gap-4 text-sm font-medium">{service.title}</h3>
                      <p className="text-sm tracking-tight text-custom-text-200">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Link href={`/${workspaceSlug}/settings/exports?provider=${service.provider}`}>
                      <span>
                        <Button variant="primary" className="capitalize">
                          {service.type}
                        </Button>
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between border-b border-custom-border-100 pb-3.5 pt-7">
              <div className="flex items-center gap-2">
                <h3 className="flex gap-2 text-xl font-medium">Previous Exports</h3>

                <button
                  type="button"
                  className="flex flex-shrink-0 items-center gap-1 rounded bg-custom-background-80 px-1.5 py-1 text-xs outline-none"
                  onClick={() => {
                    setRefreshing(true);
                    mutate(EXPORT_SERVICES_LIST(workspaceSlug as string, `${cursor}`, `${per_page}`)).then(() =>
                      setRefreshing(false)
                    );
                  }}
                >
                  <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />{" "}
                  {refreshing ? "Refreshing..." : "Refresh status"}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  disabled={!exporterServices?.prev_page_results}
                  onClick={() => exporterServices?.prev_page_results && setCursor(exporterServices?.prev_cursor)}
                  className={`flex items-center rounded border border-custom-primary-100 px-1 text-custom-primary-100 ${
                    exporterServices?.prev_page_results
                      ? "cursor-pointer hover:bg-custom-primary-100 hover:text-white"
                      : "cursor-not-allowed opacity-75"
                  }`}
                >
                  <MoveLeft className="h-4 w-4" />
                  <div className="pr-1">Prev</div>
                </button>
                <button
                  disabled={!exporterServices?.next_page_results}
                  onClick={() => exporterServices?.next_page_results && setCursor(exporterServices?.next_cursor)}
                  className={`flex items-center rounded border border-custom-primary-100 px-1 text-custom-primary-100 ${
                    exporterServices?.next_page_results
                      ? "cursor-pointer hover:bg-custom-primary-100 hover:text-white"
                      : "cursor-not-allowed opacity-75"
                  }`}
                >
                  <div className="pl-1">Next</div>
                  <MoveRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-col">
              {exporterServices && exporterServices?.results ? (
                exporterServices?.results?.length > 0 ? (
                  <div>
                    <div className="divide-y divide-custom-border-200">
                      {exporterServices?.results.map((service) => (
                        <SingleExport key={service.id} service={service} refreshing={refreshing} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <EmptyState type={EmptyStateType.WORKSPACE_SETTINGS_EXPORT} size="sm" />
                  </div>
                )
              ) : (
                <ImportExportSettingsLoader />
              )}
            </div>
          </div>
        </>
        {provider && (
          <Exporter
            isOpen
            handleClose={() => handleCsvClose()}
            data={null}
            user={currentUser || null}
            provider={provider}
            mutateServices={() => mutate(EXPORT_SERVICES_LIST(workspaceSlug as string, `${cursor}`, `${per_page}`))}
          />
        )}
      </div>
    </>
  );
});

export default IntegrationGuide;
