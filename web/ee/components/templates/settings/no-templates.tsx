import { observer } from "mobx-react";
// plane imports
import { ETemplateLevel } from "@plane/constants";
// components
import { DetailedEmptyState } from "@/components/empty-state";
// hooks
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// local imports
import { CreateTemplatesButton } from "./create-button";

type TNoTemplatesEmptyStateProps = { workspaceSlug: string } & (
  | {
      currentLevel: ETemplateLevel.WORKSPACE;
    }
  | {
      currentLevel: ETemplateLevel.PROJECT;
      projectId: string;
    }
);

export const NoTemplatesEmptyState = observer((props: TNoTemplatesEmptyStateProps) => {
  // derived values
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/templates/no-templates" });

  return (
    <DetailedEmptyState
      title={""}
      assetPath={resolvedPath}
      customPrimaryButton={
        <CreateTemplatesButton {...props} buttonSize="md" buttonI18nLabel="templates.empty_state.no_templates.button" />
      }
      className="h-fit min-h-full items-start"
    />
  );
});
