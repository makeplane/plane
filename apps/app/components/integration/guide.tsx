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

  const { user } = useUserAuth();

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
        user={user}
      />
      <div className="h-full space-y-2">
        {!provider && (
          <>
            <div className="mb-5 flex items-center gap-2">
              <div className="h-full w-full space-y-1">
                <div className="text-lg font-medium">Relocation Guide</div>
                <div className="text-sm">
                  You can now transfer all the issues that you{"'"}ve created in other tracking
                  services. This tool will guide you to relocate the issue to Plane.
                </div>
              </div>
              <a
                href="https://docs.plane.so/importers/github"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="flex flex-shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap text-sm font-medium text-[#3F76FF] hover:text-opacity-80">
                  Read More
                  <ArrowRightIcon width={"18px"} color={"#3F76FF"} />
                </div>
              </a>
            </div>
            <div className="space-y-2">
              {IMPORTERS_EXPORTERS_LIST.map((service) => (
                <div
                  key={service.provider}
                  className="rounded-[10px] border border-custom-border-100 bg-custom-background-100 p-4"
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
            <div className="rounded-[10px] border border-custom-border-100 bg-custom-background-100 p-4">
              <h3 className="mb-2 flex gap-2 text-lg font-medium">
                Previous Imports
                <button
                  type="button"
                  className="flex flex-shrink-0 items-center gap-1 rounded bg-custom-background-80 py-1 px-1.5 text-xs outline-none"
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
                    <div className="divide-y divide-custom-border-100">
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
                  <p className="py-2 text-sm text-custom-text-200">
                    No previous imports available.
                  </p>
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
        )}

        {provider && provider === "github" && <GithubImporterRoot user={user} />}
        {provider && provider === "jira" && <JiraImporterRoot user={user} />}
      </div>
    </>
  );
};

export default IntegrationGuide;
