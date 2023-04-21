import { useState } from "react";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import IntegrationService from "services/integration";
// components
import {
  DeleteImportModal,
  GithubImporterRoot,
  JiraImporterRoot,
  SingleImport,
} from "components/integration";
// ui
import { Loader, PrimaryButton } from "components/ui";
// icons
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "components/icons";
// types
import { IImporterService } from "types";
// fetch-keys
import { IMPORTER_SERVICES_LIST } from "constants/fetch-keys";
// constants
import { IMPORTERS_EXPORTERS_LIST } from "constants/workspace";

const IntegrationGuide = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [deleteImportModal, setDeleteImportModal] = useState(false);
  const [importToDelete, setImportToDelete] = useState<IImporterService | null>(null);

  const router = useRouter();
  const { workspaceSlug, provider } = router.query;

  const { data: importerServices } = useSWR(
    workspaceSlug ? IMPORTER_SERVICES_LIST(workspaceSlug as string) : null,
    workspaceSlug ? () => IntegrationService.getImporterServicesList(workspaceSlug as string) : null
  );

  const handleDeleteImport = (importService: IImporterService) => {
    setImportToDelete(importService);
    setDeleteImportModal(true);
  };

  return (
    <>
      <DeleteImportModal
        isOpen={deleteImportModal}
        handleClose={() => setDeleteImportModal(false)}
        data={importToDelete}
      />
      <div className="space-y-2 h-full">
        {!provider && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <div className="h-full w-full space-y-1">
                <div className="text-lg font-medium">Relocation Guide</div>
                <div className="text-sm">
                  You can now transfer all the issues that you{"'"}ve created in other tracking
                  services. This tool will guide you to relocate the issue to Plane.
                </div>
              </div>
              <a href="https://docs.plane.so" target="_blank" rel="noopener noreferrer">
                <div className="flex flex-shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap text-sm font-medium text-[#3F76FF] hover:text-opacity-80">
                  Read More
                  <ArrowRightIcon width={"18px"} color={"#3F76FF"} />
                </div>
              </a>
            </div>
            <div className="space-y-2">
              {IMPORTERS_EXPORTERS_LIST.map((service) => (
                <div key={service.provider} className="rounded-[10px] border bg-white p-4">
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
                      <p className="text-sm text-gray-500">{service.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <Link
                        href={`/${workspaceSlug}/settings/import-export?provider=${service.provider}`}
                      >
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
            <div className="rounded-[10px] border bg-white p-4">
              <h3 className="mb-2 font-medium text-lg flex gap-2">
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
                        <SingleImport
                          key={service.id}
                          service={service}
                          refreshing={refreshing}
                          handleDelete={() => handleDeleteImport(service)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-sm text-gray-800">No previous imports available.</div>
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
          </>
        )}

        {provider && provider === "github" && <GithubImporterRoot />}
        {provider && provider === "jira" && <JiraImporterRoot />}
      </div>
    </>
  );
};

export default IntegrationGuide;
