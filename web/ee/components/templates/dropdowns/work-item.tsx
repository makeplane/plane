import { useMemo } from "react";
import { observer } from "mobx-react";
import { Shapes } from "lucide-react";
// ui
import { CustomSearchSelect, Loader } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web hooks
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
  handleTemplateChange: (value: string) => void;
};

export const WorkItemTemplateDropdown = observer((props: TWorkItemTemplateDropdownProps) => {
  const {
    workspaceSlug,
    templateId,
    projectId,
    typeId,
    disabled = false,
    size = "sm",
    placeholder,
    handleTemplateChange,
    optionTooltip,
    buttonClassName,
  } = props;
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
      label={
        <div
          className={cn("flex w-full items-center max-w-44", {
            "gap-1": size === "xs",
            "gap-2": size === "sm",
          })}
        >
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
        </div>
      }
      options={workItemTemplateOptions}
      onChange={handleTemplateChange}
      className="w-full h-full flex"
      optionsClassName="w-44 space-y-1.5"
      buttonClassName={cn(
        "rounded text-sm py-0.5 bg-custom-background-100 border-[0.5px] border-custom-border-300",
        buttonClassName
      )}
      disabled={disabled}
      noChevron
    />
  );
});
