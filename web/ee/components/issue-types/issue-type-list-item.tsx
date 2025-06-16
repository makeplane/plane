import { observer } from "mobx-react";
import { ChevronRight } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TLoader, IIssueType } from "@plane/types";
import { Collapsible } from "@plane/ui";
// helpers
import { cn  } from "@plane/utils";
// plane web components
import { IssueTypeQuickActions, IssuePropertiesRoot, IssueTypeLogo } from "@/plane-web/components/issue-types";

type TIssueTypeListItem = {
  issueTypeId: string;
  isOpen: boolean;
  isCollapseDisabled: boolean;
  propertiesLoader: TLoader;
  containerClassName?: string;
  onToggle: (issueTypeId: string) => void;
  onEditIssueTypeIdChange: (issueTypeId: string) => void;
  getWorkItemTypeById: (issueTypeId: string) => IIssueType | undefined;
  getClassName?: (isOpen: boolean) => string;
};

export const IssueTypeListItem = observer((props: TIssueTypeListItem) => {
  const {
    issueTypeId,
    isOpen,
    isCollapseDisabled,
    propertiesLoader,
    containerClassName,
    onToggle,
    onEditIssueTypeIdChange,
    getWorkItemTypeById,
    getClassName,
  } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const issueType = getWorkItemTypeById(issueTypeId);
  // derived values
  const issueTypeDetail = issueType?.asJSON;

  if (!issueTypeDetail) return null;

  return (
    <div className={cn("py-2 border-b border-custom-border-100 last:border-b-0", containerClassName)}>
      <div
        className={cn(
          "group/issue-type bg-custom-background-100 hover:bg-custom-background-90/60 rounded-md",
          {
            "bg-custom-background-90/60": isOpen,
          },
          getClassName?.(isOpen)
        )}
      >
        <Collapsible
          key={issueTypeId}
          isOpen={isOpen}
          onToggle={() => onToggle(issueTypeId)}
          title={
            <div
              className={cn("flex items-center w-full px-2 gap-2 cursor-pointer", {
                "cursor-not-allowed": isCollapseDisabled,
              })}
            >
              <div className={cn("flex w-full gap-2 items-center truncate")}>
                <div className="flex-shrink-0">
                  <ChevronRight
                    className={cn("flex-shrink-0 size-4 transition-all", {
                      "rotate-90 text-custom-text-100": isOpen,
                      "text-custom-text-300": !isOpen,
                      "text-custom-text-400 opacity-70": isCollapseDisabled,
                    })}
                  />
                </div>
                <IssueTypeLogo
                  icon_props={issueTypeDetail?.logo_props?.icon}
                  size="xl"
                  isDefault={issueTypeDetail?.is_default}
                  containerClassName={cn(!issueTypeDetail?.is_active && "opacity-60")}
                />
                <div className="flex flex-col items-start justify-start whitespace-normal">
                  <div className="flex gap-4 text-left items-center">
                    <div className="text-sm text-custom-text-100 font-medium line-clamp-1">{issueTypeDetail?.name}</div>
                    {!issueTypeDetail?.is_active && (
                      <div className="py-0.5 px-3 text-xs rounded font-medium text-custom-text-300 bg-custom-background-80/70">
                        {t("common.disabled")}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-custom-text-300 text-left line-clamp-1">
                    {issueTypeDetail?.description}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex">
                <IssueTypeQuickActions
                  issueTypeId={issueTypeId}
                  getWorkItemTypeById={getWorkItemTypeById}
                  onEditIssueTypeIdChange={onEditIssueTypeIdChange}
                />
              </div>
              {issueTypeDetail?.is_default && (
                <div
                  className={cn(
                    "flex-shrink-0 py-0.5 px-2 text-xs rounded text-custom-primary-100 bg-transparent border border-custom-primary-100 cursor-default font-medium"
                  )}
                >
                  {t("common.default")}
                </div>
              )}
            </div>
          }
          className={cn("p-2")}
          buttonClassName={cn("flex w-full py-2 gap-2 items-center justify-between")}
        >
          <div className="p-2">
            <IssuePropertiesRoot
              issueTypeId={issueTypeId}
              propertiesLoader={propertiesLoader}
              getWorkItemTypeById={getWorkItemTypeById}
            />
          </div>
        </Collapsible>
      </div>
    </div>
  );
});
