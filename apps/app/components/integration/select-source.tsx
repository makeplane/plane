import { FC } from "react";
// icons
import { GithubIcon } from "components/icons";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
// components
import { Loader } from "components/ui";
// types
import { IIntegrationData } from "components/integration";
import { IAppIntegrations } from "types";

type Props = {
  state: IIntegrationData;
  handleState: (key: string, value: any) => void;
  allIntegrations: IAppIntegrations[] | undefined;
  allIntegrationsError: Error | undefined;
  allIntegrationImporters: any | undefined;
  allIntegrationImportersError: Error | undefined;
};

export const ImportMigrationAssistantSelectSource: FC<Props> = ({
  state,
  handleState,
  allIntegrations,
  allIntegrationsError,
  allIntegrationImporters,
  allIntegrationImportersError,
}) => (
  <div>
    <div className="space-y-6">
      {/* integrations list */}
      <div className="space-y-3">
        <div className="font-medium">Import from</div>
        {allIntegrations && !allIntegrationsError ? (
          <>
            {allIntegrations && allIntegrations.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {allIntegrations.map((_integration, _idx) => (
                  <div
                    key={_idx}
                    className="flex cursor-pointer items-center gap-2 rounded border border-gray-200 p-1 px-2 text-gray-800 hover:border-gray-100 hover:shadow-md hover:shadow-gray-200"
                    onClick={() => handleState("state", "import-configure")}
                  >
                    <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center pt-[1.5px]">
                      {_integration?.provider === "github" && (
                        <GithubIcon color={"#222"} width="22px" height="22px" />
                      )}
                    </div>
                    <div className="w-full font-medium">{_integration?.title}</div>
                    <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center">
                      <ArrowRightIcon className="h-4 w-4 text-[#222]" aria-hidden="true" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-5 text-center text-sm text-gray-800">
                Integrations not available.
              </div>
            )}
          </>
        ) : (
          <div>
            <Loader className="grid grid-cols-2 gap-3">
              {["", "", "", ""].map((_integration, _idx) => (
                <Loader.Item height="34px" width="100%" />
              ))}
            </Loader>
          </div>
        )}
      </div>

      {/* previous integration importers list */}
      <div className="space-y-3">
        <div className="font-medium">Previous Imports</div>

        {allIntegrationImporters && !allIntegrationImportersError ? (
          <>
            {allIntegrationImporters && allIntegrationImporters.length > 0 ? (
              <></>
            ) : (
              <div className="py-5 text-center text-sm text-gray-800">
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
    {/* TODO: Export Feature */}
    {/* <div className="space-y-4 rounded bg-white p-5 shadow">
        <div className="text-lg font-medium">Export</div>
        <div className="text-center text-sm">Work in Progress</div>
      </div> */}
  </div>
);
