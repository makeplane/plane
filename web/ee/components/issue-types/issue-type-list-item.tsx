import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronRight } from "lucide-react";
// ui
import { Collapsible, LayersIcon, Logo, Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web components
import { IssueTypeQuickActions, IssuePropertiesRoot } from "@/plane-web/components/issue-types";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";

type TIssueTypeListItem = {
  issueTypeId: string;
};

export const IssueTypeListItem = observer((props: TIssueTypeListItem) => {
  const { issueTypeId } = props;
  // store hooks
  const issueType = useIssueType(issueTypeId);
  // derived values
  const issueTypeDetail = issueType?.asJSON;
  // state
  const [isOpen, setIsOpen] = useState(issueTypeDetail?.is_default ?? false);

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
          onToggle={() => setIsOpen(!isOpen)}
          title={
            <div className="flex items-center w-full px-2 gap-2 cursor-pointer">
              <div className={cn("flex w-full gap-2 items-center")}>
                <div className="flex-shrink-0">
                  <ChevronRight
                    className={cn("flex-shrink-0 size-4 transition-all", {
                      "rotate-90 text-custom-text-100": isOpen,
                      "text-custom-text-300": !isOpen,
                    })}
                  />
                </div>
                <div
                  className={cn(
                    "flex-shrink-0 grid h-10 w-10 place-items-center rounded-md bg-custom-background-80/70",
                    !issueTypeDetail?.is_active && "opacity-60"
                  )}
                >
                  {issueTypeDetail?.logo_props?.in_use ? (
                    <Logo logo={issueTypeDetail.logo_props} size={20} type="lucide" />
                  ) : (
                    <LayersIcon className="h-5 w-5 text-custom-text-300" />
                  )}
                </div>
                <div className="flex flex-col w-full items-start justify-start">
                  <div className="flex gap-4 items-center">
                    <div className="text-sm text-custom-text-100 font-medium">{issueTypeDetail?.name}</div>
                  </div>
                  <Tooltip tooltipContent={issueTypeDetail?.description} position="bottom-left">
                    <div className="text-sm text-custom-text-300 text-left line-clamp-1">
                      {issueTypeDetail?.description}
                    </div>
                  </Tooltip>
                </div>
              </div>
              <div className="flex-shrink-0 flex gap-4">
                {issueTypeDetail?.is_default && (
                  <div className="py-1 px-4 text-xs rounded font-medium text-custom-text-300 bg-custom-background-80/70">
                    Default
                  </div>
                )}
                {!issueTypeDetail?.is_active && (
                  <div className="flex-shrink-0 py-0.5 px-2 text-xs rounded font-medium text-red-600 bg-red-600/10">
                    Disabled
                  </div>
                )}
                {!issueTypeDetail?.is_default && <IssueTypeQuickActions issueTypeId={issueTypeId} />}
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
