import { useMemo } from "react";
import { observer } from "mobx-react";
import { Plus, Shapes } from "lucide-react";
// plane imports
import { ETemplateLevel, ETemplateType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button, CustomSearchSelect, Loader, Tooltip, TPosition } from "@plane/ui";
// helpers
import { cn, getCreateUpdateTemplateSettingsPath } from "@plane/utils";
// plane web hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { useWorkItemTemplates } from "@/plane-web/hooks/store";

export type TWorkItemTemplateOptionTooltip = {
  [templateId: string]: string; // template id --> tooltip content
};

export type TWorkItemTemplateDropdownSize = "xs" | "sm";

type TWorkItemTemplateDropdownProps = {
  workspaceSlug: string;
  templateId: string | null;
  projectId: string;
  typeId: string | null;
  disabled?: boolean;
  size?: TWorkItemTemplateDropdownSize;
  placeholder?: string;
  optionTooltip?: TWorkItemTemplateOptionTooltip;
  buttonClassName?: string;
  customLabelContent?: React.ReactNode;
  tooltipPosition?: TPosition;
  tooltipI18nContent?: string;
  handleTemplateChange: (value: string) => void;
  handleRedirection?: () => void;
} & (
  | {
      showCreateNewTemplate: true;
      level: ETemplateLevel;
    }
  | {
      showCreateNewTemplate: false;
    }
);

export const WorkItemTemplateDropdown = observer((props: TWorkItemTemplateDropdownProps) => {
  const {
    workspaceSlug,
    templateId,
    projectId,
    typeId,
    disabled = false,
    size = "sm",
    placeholder,
    optionTooltip,
    buttonClassName,
    customLabelContent,
    showCreateNewTemplate,
    tooltipPosition = "right",
    tooltipI18nContent = "templates.dropdown.tooltip.work_item",
    handleTemplateChange,
    handleRedirection,
  } = props;
  // router
  const router = useAppRouter();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { loader, getAllWorkItemTemplatesForProject, getAllWorkItemTemplatesForProjectByTypeId, getTemplateById } =
    useWorkItemTemplates();
  // derived values
  const allWorkItemTemplates = typeId
    ? getAllWorkItemTemplatesForProjectByTypeId(workspaceSlug, projectId, typeId)
    : getAllWorkItemTemplatesForProject(workspaceSlug, projectId);
  const currentWorkItemTemplate = useMemo(
    () => (templateId ? getTemplateById(templateId) : undefined),
    [templateId, getTemplateById]
  );

  const workItemTemplateOptions = useMemo(
    () =>
      allWorkItemTemplates.map((template) => ({
        value: template.id,
        query: template.name ?? "",
        content: (
          <div className="flex w-full gap-2 items-center text-custom-text-200">
            <Shapes
              className={cn("flex-shrink-0", {
                "size-3": size === "xs",
                "size-4": size === "sm",
              })}
            />
            <div
              className={cn("truncate", {
                "text-xs": size === "xs",
                "text-sm font-medium": size === "sm",
              })}
            >
              {template.name}
            </div>
          </div>
        ),
        tooltip: optionTooltip?.[template.id] ?? undefined,
      })),
    [allWorkItemTemplates, optionTooltip, size]
  );

  const redirectToCreateTemplatePage = () => {
    if (!showCreateNewTemplate) return;

    const createTemplateSettingsPath = getCreateUpdateTemplateSettingsPath({
      type: ETemplateType.WORK_ITEM,
      workspaceSlug,
      ...(props.level === ETemplateLevel.PROJECT
        ? { level: ETemplateLevel.PROJECT, projectId }
        : { level: ETemplateLevel.WORKSPACE }),
    });

    router.push(createTemplateSettingsPath);
    handleRedirection?.();
  };

  if (loader === "init-loader") {
    return (
      <Loader className="w-16 h-full">
        <Loader.Item height="100%" />
      </Loader>
    );
  }

  return (
    <CustomSearchSelect
      value={templateId}
      customButton={
        <Tooltip position={tooltipPosition} tooltipContent={t(tooltipI18nContent)}>
          <div
            className={cn("flex w-full items-center max-w-44 px-2 py-0.5", {
              "gap-1": size === "xs",
              "gap-2": size === "sm",
            })}
          >
            {customLabelContent ? (
              customLabelContent
            ) : (
              <>
                <Shapes
                  className={cn("flex-shrink-0", templateId ? "text-custom-text-200" : "text-custom-text-300", {
                    "size-3": size === "xs",
                    "size-4": size === "sm",
                  })}
                />
                {(currentWorkItemTemplate?.name || placeholder) && (
                  <div
                    className={cn("truncate", templateId ? "text-custom-text-200" : "text-custom-text-300", {
                      "text-xs": size === "xs",
                      "text-sm font-medium": size === "sm",
                    })}
                  >
                    {templateId ? currentWorkItemTemplate?.name : placeholder}
                  </div>
                )}
              </>
            )}
          </div>
        </Tooltip>
      }
      options={workItemTemplateOptions}
      onChange={handleTemplateChange}
      className="w-full h-full flex"
      optionsClassName="w-44 space-y-1.5"
      customButtonClassName={cn(
        "rounded text-sm bg-custom-background-100 border-[0.5px] border-custom-border-300",
        buttonClassName
      )}
      disabled={disabled}
      noResultsMessage={t("templates.dropdown.no_results.work_item")}
      footerOption={
        showCreateNewTemplate ? (
          <Button
            variant="link-neutral"
            className="flex w-full justify-start items-center gap-1 px-1 py-1.5 rounded text-xs text-custom-text-200 font-medium hover:bg-custom-background-80"
            onClick={redirectToCreateTemplatePage}
          >
            <Plus className="size-3.5" />
            {t("templates.dropdown.add.work_item")}
          </Button>
        ) : undefined
      }
      noChevron
    />
  );
});
