"use client";
import { FC, useEffect } from "react";
import { observer } from "mobx-react";
import { Stepper } from "@/plane-web/components/importers/ui";
// plane web constants
import { NOTION_IMPORTER_STEPS, CONFLUENCE_IMPORTER_STEPS } from "@/plane-web/constants/importers/notion";
import { useZipImporter } from "@/plane-web/hooks/store/importers/use-zip-importer";
import { EZipDriverType, TZipImporterProps } from "@/plane-web/types/importers/zip-importer";

export const StepsRoot: FC<TZipImporterProps> = observer(({ driverType, logo, serviceName }) => {
  const { currentStepIndex, resetImporterData } = useZipImporter(driverType);

  // Reset importer data if component is unmounted
  useEffect(
    () => () => {
      resetImporterData();
    },
    [resetImporterData]
  );

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Stepper
        serviceName={serviceName}
        logo={logo}
        steps={driverType === EZipDriverType.NOTION ? NOTION_IMPORTER_STEPS : CONFLUENCE_IMPORTER_STEPS}
        currentStepIndex={currentStepIndex}
        redirectCallback={resetImporterData}
      />
    </div>
  );
});
