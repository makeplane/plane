import { observer } from "mobx-react";
import { ChevronRight } from "lucide-react";
// ui
import { Collapsible } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web components
import { IssueTypeQuickActions, IssuePropertiesRoot, IssueTypeLogo } from "@/plane-web/components/issue-types";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";

type TIssueTypeListItem = {
  issueTypeId: string;
  isOpen: boolean;
  isCollapseDisabled: boolean;
  onToggle: (issueTypeId: string) => void;
  onEditIssueTypeIdChange: (issueTypeId: string) => void;
};

export const IssueTypeListItem = observer((props: TIssueTypeListItem) => {
  const { issueTypeId, isOpen, isCollapseDisabled, onToggle, onEditIssueTypeIdChange } = props;
  // store hooks
  const issueType = useIssueType(issueTypeId);
  // derived values
  const issueTypeDetail = issueType?.asJSON;

  if (!issueTypeDetail) return null;

  return (
    <div className={cn("py-2 border-b border-custom-border-100 last:border-b-0")}>
      <div
        className={cn("group/issue-type hover:bg-custom-background-90/60 rounded-md", {
          "bg-custom-background-90/60": isOpen,
        })}
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
                        Disabled
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-custom-text-300 text-left line-clamp-1">
                    {issueTypeDetail?.description}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex">
                {issueTypeDetail?.is_default && (
                  <div
                    className={cn(
                      "py-0.5 px-2 text-xs rounded text-custom-primary-100 bg-transparent border border-custom-primary-100 cursor-default font-medium"
                    )}
                  >
                    Default
                  </div>
                )}
                <div>
                  {!issueTypeDetail?.is_default && (
                    <IssueTypeQuickActions
                      issueTypeId={issueTypeId}
                      onEditIssueTypeIdChange={onEditIssueTypeIdChange}
                    />
                  )}
                </div>
              </div>
            </div>
          }
          className={cn("p-2")}
          buttonClassName={cn("flex w-full py-2 gap-2 items-center justify-between")}
        >
          <div className="p-2">
            <IssuePropertiesRoot issueTypeId={issueTypeId} />
          </div>
        </Collapsible>
      </div>
    </div>
  );
});
