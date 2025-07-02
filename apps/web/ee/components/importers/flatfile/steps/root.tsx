import { FC } from "react";
import { observer } from "mobx-react";
import { Stepper } from "@/plane-web/components/importers/ui";
// plane web constants
import { IMPORTER_STEPS } from "@/plane-web/constants/importers/flatfile";
// hooks
import { useFlatfileImporter } from "@/plane-web/hooks/store";
// assets
import CSVLogo from "@/public/services/csv.svg";

export const StepsRoot: FC = observer(() => {
  const { currentStepIndex, resetImporterData } = useFlatfileImporter();

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Stepper
        serviceName="CSV Importer"
        logo={CSVLogo}
        steps={IMPORTER_STEPS}
        currentStepIndex={currentStepIndex}
        redirectCallback={resetImporterData}
      />
    </div>
  );
});
