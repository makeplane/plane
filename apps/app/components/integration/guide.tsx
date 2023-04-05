import { FC, useState } from "react";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

import { mutate } from "swr";

// icons
import { ArrowRightIcon } from "components/icons";
// components
import { GithubIntegrationRoot } from "components/integration";
// icons
import { ArrowPathIcon } from "@heroicons/react/24/outline";
// ui
import { Loader, PrimaryButton, SecondaryButton } from "components/ui";
// images
import GithubLogo from "public/logos/github-square.png";
// helpers
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
// types
import { IAppIntegrations, IImporterService, IWorkspaceIntegrations } from "types";
// fetch-keys
import { IMPORTER_SERVICES_LIST } from "constants/fetch-keys";

type Props = {
  provider: string | undefined;
  appIntegrations: IAppIntegrations[] | undefined;
  workspaceIntegrations: IWorkspaceIntegrations[] | undefined;
  importerServices: IImporterService[] | undefined;
};

const importersList: { [key: string]: string } = {
  github: "GitHub",
};

const IntegrationGuide: FC<Props> = ({
  provider,
  appIntegrations,
  workspaceIntegrations,
  importerServices,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <div className="space-y-5">
      {!provider && (
        <>
          <div className="flex items-center gap-2">
            <div className="h-full w-full space-y-1">
              <div className="text-lg font-medium">Relocation Guide</div>
              <div className="text-sm">
                You can now transfer all the issues that you{"'"}ve created in other tracking
                services. This tool will guide you to relocate the issue to Plane.
              </div>
            </div>
            <div className="flex flex-shrink-0 cursor-pointer items-center gap-2 text-sm font-medium text-[#3F76FF] hover:text-opacity-80">
              <div>Read More</div>
              <div>
                <ArrowRightIcon width={"18px"} color={"#3F76FF"} />
              </div>
            </div>
          </div>
          <div>
            {appIntegrations ? (
              appIntegrations.length > 0 ? (
                appIntegrations.map((integration, index) => (
                  <div key={index} className="rounded-[10px] border bg-white p-4">
                    <div className="flex items-center gap-4 whitespace-nowrap">
                      <div className="h-[40px] w-[40px] flex-shrink-0">
                        {integration?.provider === "github" && (
                          <Image src={GithubLogo} alt="GithubLogo" />
                        )}
                      </div>
                      <div className="w-full space-y-1">
                        <div className="flex items-center gap-2 font-medium">
                          <h3>{integration?.title}</h3>
                        </div>
                        <div className="text-sm text-gray-500">
                          Activate GitHub integrations on individual projects to sync with specific
                          repositories.
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Link href={`/${workspaceSlug}/settings/import-export?provider=github`}>
                          <PrimaryButton>Integrate Now</PrimaryButton>
                        </Link>
                      </div>
                    </div>

                    <h3 className="mt-6 mb-2 font-medium text-lg flex gap-2">
                      Previous Imports
                      <button
                        type="button"
                        className="flex-shrink-0 flex items-center gap-1 outline-none text-xs py-1 px-1.5 bg-gray-100 rounded"
                        onClick={() => {
                          setRefreshing(true);
                          mutate(IMPORTER_SERVICES_LIST(workspaceSlug as string)).then(() =>
                            setRefreshing(false)
                          );
                        }}
                      >
                        <ArrowPathIcon className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />{" "}
                        {refreshing ? "Refreshing..." : "Refresh status"}
                      </button>
                    </h3>
                    {importerServices ? (
                      importerServices.length > 0 ? (
                        <div className="space-y-2">
                          <div className="divide-y">
                            {importerServices.map((service) => (
                              <div key={service.id} className="py-3">
                                <h4 className="text-sm flex items-center gap-2">
                                  <span>
                                    Import from{" "}
                                    <span className="font-medium">
                                      {importersList[service.service]}
                                    </span>{" "}
                                    to{" "}
                                    <span className="font-medium">
                                      {service.project_detail.name}
                                    </span>
                                  </span>
                                  <span
                                    className={`capitalize px-2 py-0.5 text-xs rounded ${
                                      service.status === "completed"
                                        ? "bg-green-100 text-green-500"
                                        : service.status === "processing"
                                        ? "bg-yellow-100 text-yellow-500"
                                        : service.status === "failed"
                                        ? "bg-red-100 text-red-500"
                                        : ""
                                    }`}
                                  >
                                    {refreshing ? "Refreshing..." : service.status}
                                  </span>
                                </h4>
                                <div className="text-gray-500 text-xs mt-2 flex items-center gap-2">
                                  <span>{renderShortDateWithYearFormat(service.created_at)}</span>|
                                  <span>
                                    Imported by{" "}
                                    {service.initiated_by_detail.first_name &&
                                    service.initiated_by_detail.first_name !== ""
                                      ? service.initiated_by_detail.first_name +
                                        " " +
                                        service.initiated_by_detail.last_name
                                      : service.initiated_by_detail.email}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="py-2 text-sm text-gray-800">
                          No previous imports available.
                        </div>
                      )
                    ) : (
                      <Loader className="grid grid-cols-1 gap-3 mt-6">
                        <Loader.Item height="40px" width="100%" />
                        <Loader.Item height="40px" width="100%" />
                        <Loader.Item height="40px" width="100%" />
                        <Loader.Item height="40px" width="100%" />
                      </Loader>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-5 text-center text-sm text-gray-800">
                  Integrations not available.
                </div>
              )
            ) : (
              <Loader className="grid grid-cols-1 gap-3">
                <Loader.Item height="34px" width="100%" />
                <Loader.Item height="34px" width="100%" />
              </Loader>
            )}
          </div>
        </>
      )}

      {provider && provider === "github" && (
        <GithubIntegrationRoot
          provider={provider}
          appIntegrations={appIntegrations}
          workspaceIntegrations={workspaceIntegrations}
        />
      )}
    </div>
  );
};

export default IntegrationGuide;
