import { useMemo } from "react";
import { observer } from "mobx-react";
import { Plus, Shapes } from "lucide-react";
// ui
import { ETemplateLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ETemplateType } from "@plane/types";
import { Button, CustomSearchSelect, Loader } from "@plane/ui";
// helpers
import { cn, getCreateUpdateTemplateSettingsPath } from "@plane/utils";
// plane web hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { useProjectTemplates } from "@/plane-web/hooks/store";

export type TProjectTemplateOptionTooltip = {
  [templateId: string]: string; // template id --> tooltip content
};

export type TProjectTemplateDropdownSize = "xs" | "sm";

type TProjectTemplateDropdownProps = {
  workspaceSlug: string;
  templateId: string | null;
  disabled?: boolean;
  size?: TProjectTemplateDropdownSize;
  placeholder?: string;
  optionTooltip?: TProjectTemplateOptionTooltip;
  buttonClassName?: string;
  customLabelContent?: React.ReactNode;
  showCreateNewTemplate?: boolean;
  handleTemplateChange: (value: string) => void;
  handleRedirection?: () => void;
};

export const ProjectTemplateDropdown = observer((props: TProjectTemplateDropdownProps) => {
  const {
    workspaceSlug,
    templateId,
    disabled = false,
    size = "sm",
    placeholder,
    optionTooltip,
    buttonClassName,
    customLabelContent,
    showCreateNewTemplate = false,
    handleTemplateChange,
    handleRedirection,
  } = props;
  // router
  const router = useAppRouter();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { loader, getAllTemplates, getTemplateById } = useProjectTemplates();
  // derived values
  const allProjectTemplates = getAllTemplates(workspaceSlug);
  const currentProjectTemplate = useMemo(
    () => (templateId ? getTemplateById(templateId) : undefined),
    [templateId, getTemplateById]
  );

  const projectTemplateOptions = useMemo(
    () =>
      allProjectTemplates.map((template) => ({
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
    [allProjectTemplates, optionTooltip, size]
  );

  const redirectToCreateTemplatePage = () => {
    if (!showCreateNewTemplate) return;

    const createTemplateSettingsPath = getCreateUpdateTemplateSettingsPath({
      type: ETemplateType.PROJECT,
      workspaceSlug,
      level: ETemplateLevel.WORKSPACE,
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
        <div
          className={cn("flex w-full items-center max-w-52 px-2 py-0.5", {
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
              {(currentProjectTemplate?.name || placeholder) && (
                <div
                  className={cn("truncate", templateId ? "text-custom-text-200" : "text-custom-text-300", {
                    "text-xs": size === "xs",
                    "text-sm font-medium": size === "sm",
                  })}
                >
                  {templateId ? currentProjectTemplate?.name : placeholder}
                </div>
              )}
            </>
          )}
        </div>
      }
      options={projectTemplateOptions}
      onChange={handleTemplateChange}
      className="w-full h-full flex"
      optionsClassName="w-44 space-y-1.5"
      customButtonClassName={cn(
        "rounded text-sm bg-custom-background-100 border-[0.5px] border-custom-border-300",
        buttonClassName
      )}
      disabled={disabled}
      noResultsMessage={t("templates.dropdown.no_results.project")}
      footerOption={
        showCreateNewTemplate ? (
          <Button
            variant="link-neutral"
            className="flex w-full justify-start items-center gap-1 px-1 py-1.5 rounded text-xs text-custom-text-200 font-medium hover:bg-custom-background-80"
            onClick={redirectToCreateTemplatePage}
          >
            <Plus className="size-3.5" />
            {t("templates.dropdown.add.project")}
          </Button>
        ) : undefined
      }
      noChevron
    />
  );
});
