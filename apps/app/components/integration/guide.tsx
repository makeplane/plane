import { FC } from "react";
// next imports
import Link from "next/link";
import Image from "next/image";
// icons
import { ArrowRightIcon } from "components/icons";
import GithubLogo from "public/logos/github-square.png";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
// components
import { Loader } from "components/ui";
import { GithubIntegrationRoot } from "components/integration";
// types
import { IAppIntegrations } from "types";

type Props = {
  workspaceSlug: string | undefined;
  provider: string | undefined;
  allIntegrations: IAppIntegrations[] | undefined;
  allIntegrationsError: Error | undefined;
  allWorkspaceIntegrations: any | undefined;
  allWorkspaceIntegrationsError: Error | undefined;
  allIntegrationImporters: any | undefined;
  allIntegrationImportersError: Error | undefined;
};

const IntegrationGuide: FC<Props> = ({
  workspaceSlug,
  provider,
  allIntegrations,
  allIntegrationsError,
  allWorkspaceIntegrations,
  allWorkspaceIntegrationsError,
  allIntegrationImporters,
  allIntegrationImportersError,
}) => (
  <div className="space-y-5">
    {!provider && (
      <>
        <div className="text-2xl font-semibold">Import</div>

        <div className="flex items-center gap-2">
          <div className="h-full w-full space-y-1">
            <div className="text-lg font-medium">Relocation Guide</div>
            <div className="text-sm">
              You can now transfer all the issues that you’ve created in other tracking services.
              This tool will guide you to relocate the issue to Plane.
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
          {allIntegrations && !allIntegrationsError ? (
            <>
              {allIntegrations && allIntegrations.length > 0 ? (
                <>
                  {allIntegrations.map((_integration, _idx) => (
                    <div
                      key={_idx}
                      className="space-y-4 rounded border border-gray-200 bg-white p-4"
                    >
                      <div className="flex items-center gap-4 whitespace-nowrap">
                        <div className="h-[40px] w-[40px] flex-shrink-0">
                          {_integration?.provider === "github" && (
                            <Image src={GithubLogo} alt="GithubLogo" />
                          )}
                        </div>
                        <div className="w-full space-y-1">
                          <div className="flex items-center gap-2 font-medium">
                            <div>{_integration?.title}</div>
                            <div className="rounded-full border border-gray-200 bg-gray-200 px-3 text-[12px]">
                              0
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            Activate GitHub integrations on individual projects to sync with
                            specific repositories.
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Link href={`/${workspaceSlug}/settings/import-export?provider=github`}>
                            <button
                              type="button"
                              className="w-full rounded bg-[#3F76FF] py-1.5 px-4 text-center text-sm text-white hover:bg-opacity-90"
                            >
                              Integrate Now
                            </button>
                          </Link>
                        </div>
                        <div className="flex h-[24px] w-[24px] flex-shrink-0 cursor-pointer items-center justify-center rounded-sm bg-gray-100 hover:bg-gray-200">
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                      </div>

                      <div>
                        {allIntegrationImporters && !allIntegrationImportersError ? (
                          <>
                            {allIntegrationImporters && allIntegrationImporters.length > 0 ? (
                              <></>
                            ) : (
                              <div className="py-2 text-sm text-gray-800">
                                Previous Imports not available.
                              </div>
                            )}
                          </>
                        ) : (
                          <div>
                            <Loader className="grid grid-cols-1 gap-3">
                              {["", ""].map((_integration, _idx) => (
                                <Loader.Item height="40px" width="100%" />
                              ))}
                            </Loader>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="py-5 text-center text-sm text-gray-800">
                  Integrations not available.
                </div>
              )}
            </>
          ) : (
            <div>
              <Loader className="grid grid-cols-1 gap-3">
                {["", ""].map((_integration, _idx) => (
                  <Loader.Item height="34px" width="100%" />
                ))}
              </Loader>
            </div>
          )}
        </div>
      </>
    )}

    {provider && (
      <>
        {provider === "github" && (
          <GithubIntegrationRoot
            workspaceSlug={workspaceSlug}
            provider={provider}
            allIntegrations={allIntegrations}
            allIntegrationsError={allIntegrationsError}
            allWorkspaceIntegrations={allWorkspaceIntegrations}
            allWorkspaceIntegrationsError={allWorkspaceIntegrationsError}
            allIntegrationImporters={allIntegrationImporters}
            allIntegrationImportersError={allIntegrationImportersError}
          />
        )}
      </>
    )}
  </div>
);

export default IntegrationGuide;
