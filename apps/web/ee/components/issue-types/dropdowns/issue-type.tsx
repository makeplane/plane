import { observer } from "mobx-react";
// plane imports
import { LayersIcon } from "@plane/propel/icons";
import { IIssueType } from "@plane/types";
import { CustomSearchSelect, Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// ce imports
import type { TIssueTypeDropdownVariant } from "@/ce/components/issues/issue-modal";
// plane web types
import { IssueTypeLogo } from "@/plane-web/components/issue-types/common/issue-type-logo";

export type TIssueTypeOptionTooltip = {
  [issueTypeId: string]: string; // issue type id --> tooltip content
};

type TIssueTypeDropdownProps = {
  buttonClassName?: string;
  disabled?: boolean;
  getWorkItemTypes: (projectId: string, activeOnly: boolean) => Record<string, IIssueType>;
  handleIssueTypeChange: (value: string) => void;
  isInitializing?: boolean;
  issueTypeId: string | null;
  optionTooltip?: TIssueTypeOptionTooltip;
  placeholder?: string;
  projectId: string;
  variant?: TIssueTypeDropdownVariant;
};

export const IssueTypeDropdown = observer((props: TIssueTypeDropdownProps) => {
  const {
    issueTypeId,
    projectId,
    disabled = false,
    variant = "sm",
    placeholder = "Work item type",
    isInitializing = false,
    handleIssueTypeChange,
    optionTooltip,
    buttonClassName,
    getWorkItemTypes,
  } = props;
  // derived values
  const allIssueTypes = getWorkItemTypes(projectId, false);
  const activeIssueTypes = getWorkItemTypes(projectId, true);

  // Can be used with CustomSearchSelect as well
  const issueTypeOptions = Object.entries(activeIssueTypes).map(([issueTypeId, issueTypeDetail]) => ({
    value: issueTypeId,
    query: issueTypeDetail.name ?? "",
    content: (
      <div className="flex w-full gap-2 items-center">
        <IssueTypeLogo icon_props={issueTypeDetail?.logo_props?.icon} isDefault={issueTypeDetail?.is_default} />
        <div
          className={cn("text-custom-text-200 truncate", {
            "text-xs": variant === "xs",
            "text-sm font-medium": variant === "sm",
          })}
        >
          {issueTypeDetail.name}
        </div>
      </div>
    ),
    tooltip: optionTooltip?.[issueTypeId] ?? undefined,
  }));

  if (isInitializing) {
    return (
      <Loader className="w-16 h-full">
        <Loader.Item height="100%" />
      </Loader>
    );
  }

  return (
    <CustomSearchSelect
      value={issueTypeId}
      label={
        <div
          className={cn("flex w-full items-center max-w-44", {
            "gap-1": variant === "xs",
            "gap-2": variant === "sm",
          })}
        >
          {!issueTypeId && (
            <LayersIcon
              className={cn("flex-shrink-0 text-custom-text-300", {
                "size-3": variant === "xs",
                "size-4": variant === "sm",
              })}
            />
          )}
          {issueTypeId && (
            <IssueTypeLogo
              icon_props={allIssueTypes[issueTypeId]?.logo_props?.icon}
              isDefault={allIssueTypes[issueTypeId]?.is_default}
              size={variant}
            />
          )}
          <div
            className={cn("truncate", issueTypeId ? "text-custom-text-200" : "text-custom-text-300", {
              "text-xs": variant === "xs",
              "text-sm font-medium": variant === "sm",
            })}
          >
            {issueTypeId ? allIssueTypes[issueTypeId]?.name : placeholder}
          </div>
        </div>
      }
      options={issueTypeOptions}
      onChange={handleIssueTypeChange}
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
