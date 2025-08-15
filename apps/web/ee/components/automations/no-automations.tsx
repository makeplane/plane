import { observer } from "mobx-react";
// components
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
// hooks
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { CreateAutomationButton } from "./create-button";

export const NoAutomationsEmptyState = observer(() => {
  // derived values
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/templates/no-templates" }); // TODO: Update path to automations

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-center h-full w-full">
        <DetailedEmptyState
          title={""}
          assetPath={resolvedPath}
          className="h-fit min-h-full items-start !p-0"
          size="md"
          customPrimaryButton={<CreateAutomationButton />}
        />
      </div>
    </div>
  );
});
