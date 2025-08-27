// plane imports
import { useTranslation } from "@plane/i18n";
import { EActionNodeHandlerName } from "@plane/types";
// local imports
import { AutomationActionAddCommentConfiguration } from "./add_comment/root";
import { AutomationActionChangePropertyConfiguration } from "./change-property/root";

type TProps = {
  automationId: string;
  isDisabled?: boolean;
  projectId: string;
  selectedHandlerName: EActionNodeHandlerName;
  workspaceId: string;
  workspaceSlug: string;
};

export const AutomationActionConfigurationRoot: React.FC<TProps> = (props) => {
  const { automationId, isDisabled, selectedHandlerName, projectId, workspaceId, workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();

  return (
    <div className="space-y-2.5">
      <p className="text-custom-text-200 text-xs font-medium">{t("automations.action.configuration.label")}</p>
      {selectedHandlerName === EActionNodeHandlerName.ADD_COMMENT && (
        <AutomationActionAddCommentConfiguration
          automationId={automationId}
          isDisabled={isDisabled}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
        />
      )}
      {selectedHandlerName === EActionNodeHandlerName.CHANGE_PROPERTY && (
        <AutomationActionChangePropertyConfiguration isDisabled={isDisabled} projectId={projectId} />
      )}
    </div>
  );
};
