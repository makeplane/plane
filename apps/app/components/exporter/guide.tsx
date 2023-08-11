import { useState } from "react";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// hooks
import useUserAuth from "hooks/use-user-auth";
// services
import IntegrationService from "services/integration";
// components
import { Exporter, SingleExport } from "components/exporter";
// ui
import { Icon, Loader, PrimaryButton } from "components/ui";
// icons
import { ArrowPathIcon } from "@heroicons/react/24/outline";
// fetch-keys
import { EXPORT_SERVICES_LIST } from "constants/fetch-keys";
// constants
import { EXPORTERS_LIST } from "constants/workspace";

const IntegrationGuide = () => {
  const [refreshing, setRefreshing] = useState(false);
  const per_page = 10;
  const [cursor, setCursor] = useState<string | undefined>(`10:0:0`);

  const router = useRouter();
  const { workspaceSlug, provider } = router.query;

  const { user } = useUserAuth();

  const { data: exporterServices } = useSWR(
    workspaceSlug && cursor
      ? EXPORT_SERVICES_LIST(workspaceSlug as string, cursor, `${per_page}`)
      : null,
    workspaceSlug && cursor
      ? () => IntegrationService.getExportsServicesList(workspaceSlug as string, cursor, per_page)
      : null
  );

  const handleCsvClose = () => {
    router.replace(`/plane/settings/exports`);
  };

  return (
    <>
      <div className="h-full space-y-2">
        <>
          <div className="space-y-2">
            {EXPORTERS_LIST.map((service) => (
              <div
                key={service.provider}
                className="rounded-[10px] border border-custom-border-200 bg-custom-background-100 p-4"
              >
                <div className="flex items-center gap-4 whitespace-nowrap">
                  <div className="relative h-10 w-10 flex-shrink-0">
                    <Image
                      src={service.logo}
                      layout="fill"
                      objectFit="cover"
                      alt={`${service.title} Logo`}
                    />
                  </div>
                  <div className="w-full">
                    <h3>{service.title}</h3>
                    <p className="text-sm text-custom-text-200">{service.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Link href={`/${workspaceSlug}/settings/export?provider=${service.provider}`}>
                      <a>
                        <PrimaryButton>
                          <span className="capitalize">{service.type}</span> now
                        </PrimaryButton>
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-[10px] border border-custom-border-200 bg-custom-background-100 p-4">
            <h3 className="mb-2 flex gap-2 text-lg font-medium justify-between">
              <div className="flex gap-2">
                <div className="">Previous Exports</div>
                <button
                  type="button"
                  className="flex flex-shrink-0 items-center gap-1 rounded bg-custom-background-80 py-1 px-1.5 text-xs outline-none"
                  onClick={() => {
                    setRefreshing(true);
                    mutate(
                      EXPORT_SERVICES_LIST(workspaceSlug as string, `${cursor}`, `${per_page}`)
                    ).then(() => setRefreshing(false));
                  }}
                >
                  <ArrowPathIcon className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />{" "}
                  {refreshing ? "Refreshing..." : "Refresh status"}
                </button>
              </div>
              <div className="flex gap-2 items-center text-xs">
                <button
                  disabled={!exporterServices?.prev_page_results}
                  onClick={() =>
                    exporterServices?.prev_page_results && setCursor(exporterServices?.prev_cursor)
                  }
                  className={`flex items-center border border-custom-primary-100 text-custom-primary-100 px-1 rounded ${
                    exporterServices?.prev_page_results
                      ? "cursor-pointer hover:bg-custom-primary-100 hover:text-white"
                      : "cursor-not-allowed opacity-75"
                  }`}
                >
                  <Icon iconName="keyboard_arrow_left" className="!text-lg" />
                  <div className="pr-1">Prev</div>
                </button>
                <button
                  disabled={!exporterServices?.next_page_results}
                  onClick={() =>
                    exporterServices?.next_page_results && setCursor(exporterServices?.next_cursor)
                  }
                  className={`flex items-center border border-custom-primary-100 text-custom-primary-100 px-1 rounded ${
                    exporterServices?.next_page_results
                      ? "cursor-pointer hover:bg-custom-primary-100 hover:text-white"
                      : "cursor-not-allowed opacity-75"
                  }`}
                >
                  <div className="pl-1">Next</div>
                  <Icon iconName="keyboard_arrow_right" className="!text-lg" />
                </button>
              </div>
            </h3>
            {exporterServices && exporterServices?.results ? (
              exporterServices?.results?.length > 0 ? (
                <div className="space-y-2">
                  <div className="divide-y divide-custom-border-200">
                    {exporterServices?.results.map((service) => (
                      <SingleExport key={service.id} service={service} refreshing={refreshing} />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-2 text-sm text-custom-text-200">No previous export available.</p>
              )
            ) : (
              <Loader className="mt-6 grid grid-cols-1 gap-3">
                <Loader.Item height="40px" width="100%" />
                <Loader.Item height="40px" width="100%" />
                <Loader.Item height="40px" width="100%" />
                <Loader.Item height="40px" width="100%" />
              </Loader>
            )}
          </div>
        </>
        {provider && (
          <Exporter
            isOpen={true}
            handleClose={() => handleCsvClose()}
            data={null}
            user={user}
            provider={provider}
            mutateServices={() =>
              mutate(EXPORT_SERVICES_LIST(workspaceSlug as string, `${cursor}`, `${per_page}`))
            }
          />
        )}
      </div>
    </>
  );
};

export default IntegrationGuide;
