import { AlertCircle } from "lucide-react";
import { ISSUE_ORDER_BY_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TIssueOrderByOptions } from "@plane/types";
import { cn } from "@/helpers/common.helper";

type Props = {
  dragColumnOrientation: "justify-start" | "justify-center" | "justify-end";
  canOverlayBeVisible: boolean;
  isDropDisabled: boolean;
  dropErrorMessage?: string;
  orderBy?: TIssueOrderByOptions | undefined;
  isDraggingOverColumn: boolean;
};

export const GroupDragOverlay = (props: Props) => {
  const {
    dragColumnOrientation,
    canOverlayBeVisible,
    isDropDisabled,
    dropErrorMessage,
    orderBy,
    isDraggingOverColumn,
  } = props;
  const { t } = useTranslation();

  const shouldOverlayBeVisible = isDraggingOverColumn && canOverlayBeVisible;
  const readableOrderBy =
    orderBy && ISSUE_ORDER_BY_OPTIONS.find((orderByObj) => orderByObj.key === orderBy)?.titleTranslationKey;

  return (
    <div
      className={cn(
        `absolute top-0 left-0 h-full w-full items-center text-sm font-medium text-custom-text-300 rounded bg-custom-background-overlay ${dragColumnOrientation}`,
        {
          "flex flex-col border-[1px] border-custom-border-300 z-[2]": shouldOverlayBeVisible,
        },
        { hidden: !shouldOverlayBeVisible }
      )}
    >
      <div
        className={cn(
          "p-3 my-8 flex flex-col rounded items-center",
          {
            "text-custom-text-200": shouldOverlayBeVisible,
          },
          {
            "text-custom-text-error": isDropDisabled,
          }
        )}
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
            <span>{t("entity.drop_here_to_move", { entity: t("project.label", { count: 2 }) })}</span>
            {/** Count is added for pluralization */}
          </>
        )}
      </div>
    </div>
  );
};
