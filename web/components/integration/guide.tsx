import { useState } from "react";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// hooks
import useUserAuth from "hooks/use-user-auth";
// services
import { IntegrationService } from "services/integrations";
// components
import { DeleteImportModal, GithubImporterRoot, JiraImporterRoot, SingleImport } from "components/integration";
// ui
import { Button, Loader } from "@plane/ui";
// icons
import { ArrowPathIcon } from "@heroicons/react/24/outline";
// types
import { IImporterService } from "types";
// fetch-keys
import { IMPORTER_SERVICES_LIST } from "constants/fetch-keys";
// constants
import { IMPORTERS_EXPORTERS_LIST } from "constants/workspace";

// services
const integrationService = new IntegrationService();

const IntegrationGuide = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [deleteImportModal, setDeleteImportModal] = useState(false);
  const [importToDelete, setImportToDelete] = useState<IImporterService | null>(null);

  const router = useRouter();
  const { workspaceSlug, provider } = router.query;

  const { user } = useUserAuth();

  const { data: importerServices } = useSWR(
    workspaceSlug ? IMPORTER_SERVICES_LIST(workspaceSlug as string) : null,
    workspaceSlug ? () => integrationService.getImporterServicesList(workspaceSlug as string) : null
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
      <div className="h-full">
        {(!provider || provider === "csv") && (
          <>
            {/* <div className="mb-5 flex items-center gap-2">
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
            </div> */}
            {IMPORTERS_EXPORTERS_LIST.map((service) => (
              <div
                key={service.provider}
                className="flex items-center justify-between gap-2 border-b border-custom-border-200 bg-custom-background-100 px-4 py-6"
              >
                <div className="flex items-start gap-4">
                  <div className="relative h-10 w-10 flex-shrink-0">
                    <Image src={service.logo} layout="fill" objectFit="cover" alt={`${service.title} Logo`} />
                  </div>
                  <div>
                    <h3 className="flex items-center gap-4 text-sm font-medium">{service.title}</h3>
                    <p className="text-sm text-custom-text-200 tracking-tight">{service.description}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Link href={`/${workspaceSlug}/settings/imports?provider=${service.provider}`}>
                    <a>
                      <Button variant="primary">{service.type}</Button>
                    </a>
                  </Link>
                </div>
              </div>
            ))}
            <div>
              <div className="flex items-center pt-7 pb-3.5 border-b border-custom-border-200">
                <h3 className="flex gap-2 text-xl font-medium">
                  Previous Imports
                  <button
                    type="button"
                    className="flex flex-shrink-0 items-center gap-1 rounded bg-custom-background-80 py-1 px-1.5 text-xs outline-none"
                    onClick={() => {
                      setRefreshing(true);
                      mutate(IMPORTER_SERVICES_LIST(workspaceSlug as string)).then(() => setRefreshing(false));
                    }}
                  >
                    <ArrowPathIcon className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />{" "}
                    {refreshing ? "Refreshing..." : "Refresh status"}
                  </button>
                </h3>
              </div>
              <div className="flex flex-col">
                {importerServices ? (
                  importerServices.length > 0 ? (
                    <div className="space-y-2">
                      <div className="divide-y divide-custom-border-200">
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
                    <p className="text-sm text-custom-text-200 px-4 py-6">No previous imports available.</p>
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
