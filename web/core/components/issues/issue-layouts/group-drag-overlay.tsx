import { useRef } from "react";
import { AlertCircle } from "lucide-react";
// plane imports
import { ISSUE_ORDER_BY_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TIssueOrderByOptions } from "@plane/types";
// helpers
import { cn } from "@plane/utils";
// plane web imports
import { WorkFlowDisabledOverlay } from "@/plane-web/components/workflow";

type Props = {
  dragColumnOrientation: "justify-start" | "justify-center" | "justify-end";
  workflowDisabledSource?: string;
  canOverlayBeVisible: boolean;
  isDropDisabled: boolean;
  dropErrorMessage?: string;
  orderBy: TIssueOrderByOptions | undefined;
  isDraggingOverColumn: boolean;
  isEpic?: boolean;
};

export const GroupDragOverlay = (props: Props) => {
  const {
    dragColumnOrientation,
    canOverlayBeVisible,
    workflowDisabledSource,
    isDropDisabled,
    dropErrorMessage,
    orderBy,
    isDraggingOverColumn,
    isEpic = false,
  } = props;
  // hooks
  const { t } = useTranslation();
  // refs
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const shouldOverlayBeVisible = isDraggingOverColumn && canOverlayBeVisible;
  const readableOrderBy = t(
    ISSUE_ORDER_BY_OPTIONS.find((orderByObj) => orderByObj.key === orderBy)?.titleTranslationKey || ""
  );

  return (
    <div
      ref={messageContainerRef}
      className={cn(
        `absolute top-0 left-0 h-full w-full items-center text-sm font-medium text-custom-text-300 rounded bg-custom-background-80/85 ${dragColumnOrientation}`,
        {
          "flex flex-col border-[1px] border-custom-border-300 z-[2]": shouldOverlayBeVisible,
          "bg-red-200/60": workflowDisabledSource && isDropDisabled,
        },
        { hidden: !shouldOverlayBeVisible }
      )}
    >
      {workflowDisabledSource ? (
        <WorkFlowDisabledOverlay
          messageContainerRef={messageContainerRef}
          workflowDisabledSource={workflowDisabledSource}
          shouldOverlayBeVisible={shouldOverlayBeVisible}
        />
      ) : (
        <div
          className={cn("p-3 my-8 flex flex-col rounded items-center", {
            "text-custom-text-200": shouldOverlayBeVisible,
            "text-custom-text-error": isDropDisabled,
          })}
        >
          {dropErrorMessage ? (
            <div className="flex items-center">
              <AlertCircle width={13} height={13} /> &nbsp;
              <span>{dropErrorMessage}</span>
            </div>
          ) : (
            <>
              {readableOrderBy && (
                <span>
                  {t("issue.layouts.ordered_by_label")} <span className="font-semibold">{t(readableOrderBy)}</span>.
                </span>
              )}
              <span>{t("entity.drop_here_to_move", { entity: isEpic ? "epic" : "work item" })}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
