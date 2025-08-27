import React, { useRef } from "react";
import merge from "lodash/merge";
import { observer } from "mobx-react";
import { FormProvider, useForm } from "react-hook-form";
import { Trash2 } from "lucide-react";
// plane imports
import { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import {
  EActionNodeHandlerName,
  TAutomationActionNode,
  TChangePropertyActionFormConfig,
  TAddCommentActionConfig,
  TAutomationActionNodeConfig,
} from "@plane/types";
import { isCommentEmpty } from "@plane/utils";
// plane web imports
import { AutomationDetailsSidebarActionButtons } from "@/plane-web/components/automations/details/sidebar/action-buttons";
import { AutomationDetailsSidebarSectionWrapper } from "@/plane-web/components/automations/details/sidebar/section-wrapper";
// local imports
import { AutomationActionConfigurationRoot } from "./configuration/root";
import { AutomationActionHandlerDropdown } from "./handler/root";
import { AutomationDetailsSidebarActionFormHeaderButton } from "./header-button";

export type TAutomationActionFormData = {
  handler_name: EActionNodeHandlerName | undefined;
  config: TAutomationActionNodeConfig | TChangePropertyActionFormConfig | undefined;
};

const DEFAULT_AUTOMATION_ACTION_FORM_DATA: TAutomationActionFormData = {
  handler_name: undefined,
  config: undefined,
};

const DEFAULT_ADD_COMMENT_CONFIG: TAddCommentActionConfig = {
  comment_text: "<p></p>",
};

const DEFAULT_CHANGE_PROPERTY_CONFIG: TChangePropertyActionFormConfig = {
  change_type: undefined,
  property_name: undefined,
  property_value: [],
};

export enum EAutomationActionFormType {
  NEW = "new",
  EXISTING = "existing",
}

type TNewAutomationAction = {
  type: EAutomationActionFormType.NEW;
};

type TExistingAutomationAction = {
  type: EAutomationActionFormType.EXISTING;
  data: TAutomationActionNode;
  isOnlyActionNode: boolean;
  isAutomationEnabled: boolean;
};

type TProps = {
  automationId: string;
  currentIndex: number;
  defaultOpen?: boolean;
  isSubmitting: boolean;
  onCancel?: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  onSubmit: (data: TAutomationActionFormData) => void | Promise<void>;
  projectId: string;
  workspaceId: string;
  workspaceSlug: string;
} & (TNewAutomationAction | TExistingAutomationAction);

const AutomationDetailsSidebarActionsFormRootComponent = React.forwardRef<HTMLFormElement, TProps>((props, ref) => {
  const {
    automationId,
    currentIndex,
    defaultOpen = true,
    isSubmitting,
    onCancel,
    onDelete,
    onSubmit,
    type,
    projectId,
    workspaceId,
    workspaceSlug,
  } = props;
  // plane hooks
  const { t } = useTranslation();
  // editor ref
  const editorRef = useRef<EditorRefApi>(null);
  // form state
  const defaultValueForReset =
    type === EAutomationActionFormType.EXISTING
      ? merge({}, DEFAULT_AUTOMATION_ACTION_FORM_DATA, props.data)
      : DEFAULT_AUTOMATION_ACTION_FORM_DATA;
  const methods = useForm<TAutomationActionFormData>({
    defaultValues: defaultValueForReset,
  });
  // derived values
  const selectedHandlerName = methods.watch("handler_name");
  const selectedConfig = methods.watch("config");
  const isFormDirty = methods.formState.isDirty;
  const isDeleteButtonDisabled =
    type === EAutomationActionFormType.EXISTING && props.isAutomationEnabled && props.isOnlyActionNode;
  const isNextButtonDisabled = () => {
    if (!selectedHandlerName || !selectedConfig) return true;
    if (selectedHandlerName === EActionNodeHandlerName.CHANGE_PROPERTY) {
      const changePropertyConfig = selectedConfig as TChangePropertyActionFormConfig | undefined;
      return (
        !changePropertyConfig?.property_name ||
        !changePropertyConfig?.change_type ||
        !changePropertyConfig?.property_value ||
        changePropertyConfig.property_value.length === 0
      );
    }
    if (selectedHandlerName === EActionNodeHandlerName.ADD_COMMENT) {
      const addCommentConfig = selectedConfig as TAddCommentActionConfig | undefined;
      return !addCommentConfig?.comment_text || isCommentEmpty(addCommentConfig?.comment_text);
    }
    return false;
  };

  const handleHandlerNameChange = (value: EActionNodeHandlerName) => {
    methods.setValue("handler_name", value, {
      shouldDirty: true,
    });
    if (value === EActionNodeHandlerName.CHANGE_PROPERTY) {
      methods.setValue("config", DEFAULT_CHANGE_PROPERTY_CONFIG, {
        shouldDirty: true,
      });
    }
    if (value === EActionNodeHandlerName.ADD_COMMENT) {
      methods.setValue("config", DEFAULT_ADD_COMMENT_CONFIG, {
        shouldDirty: true,
      });
    }
  };

  const handleSubmit = async (data: TAutomationActionFormData): Promise<void> => {
    try {
      await onSubmit(data);
      methods.reset(data);
    } catch (error) {
      throw error;
    }
  };

  const handleCancel = () => {
    methods.reset(defaultValueForReset);
    const config = defaultValueForReset.config as TAddCommentActionConfig | undefined;
    editorRef.current?.setEditorValue(config?.comment_text || "<p></p>", true);
    onCancel?.();
  };

  return (
    <FormProvider {...methods}>
      <form ref={ref} onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4">
        <AutomationDetailsSidebarSectionWrapper
          defaultOpen={defaultOpen}
          title={`${t("automations.action.label")} #${currentIndex + 1}`}
          actionButtons={
            <AutomationDetailsSidebarActionButtons
              previousButton={
                isFormDirty
                  ? {
                      label: t("common.cancel"),
                      onClick: handleCancel,
                      renderIcon: false,
                      isDisabled: isSubmitting,
                    }
                  : undefined
              }
              nextButton={
                isFormDirty
                  ? {
                      type: "submit",
                      label: isSubmitting ? t("common.confirming") : t("common.confirm"),
                      isDisabled: isNextButtonDisabled() || isSubmitting,
                      renderIcon: false,
                    }
                  : undefined
              }
              borderPosition="bottom"
            />
          }
          headerActions={(open) =>
            open && (
              <AutomationDetailsSidebarActionFormHeaderButton
                onClick={onDelete}
                variant="destructive"
                isDisabled={isDeleteButtonDisabled}
                tooltipMessage={
                  isDeleteButtonDisabled ? t("automations.action.validation.delete_only_action") : undefined
                }
              >
                <Trash2 className="size-3.5" />
              </AutomationDetailsSidebarActionFormHeaderButton>
            )
          }
        >
          <AutomationActionHandlerDropdown value={methods.watch("handler_name")} onChange={handleHandlerNameChange} />
          {selectedHandlerName && (
            <AutomationActionConfigurationRoot
              automationId={automationId}
              editorRef={editorRef}
              selectedHandlerName={selectedHandlerName}
              projectId={projectId}
              workspaceId={workspaceId}
              workspaceSlug={workspaceSlug}
            />
          )}
        </AutomationDetailsSidebarSectionWrapper>
      </form>
    </FormProvider>
  );
});
AutomationDetailsSidebarActionsFormRootComponent.displayName = "AutomationDetailsSidebarActionsFormRoot";

export const AutomationDetailsSidebarActionsFormRoot = observer(AutomationDetailsSidebarActionsFormRootComponent);
