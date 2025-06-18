import { FC } from "react";
import { FileText } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TWorkItemAdditionalWidgetActionButtonsProps } from "@/ce/components/issues/issue-detail-widgets/action-buttons";
import { IssueDetailWidgetButton } from "@/components/issues";
import { PagesActionButton } from "./pages";
export const WorkItemAdditionalWidgetActionButtons: FC<TWorkItemAdditionalWidgetActionButtonsProps> = (props) => {
  const { workspaceSlug, workItemId, disabled, issueServiceType, hideWidgets } = props;
  const { t } = useTranslation();
  return (
    <>
      {!hideWidgets?.includes("pages") && (
        <PagesActionButton
          issueServiceType={issueServiceType}
          disabled={disabled}
          workItemId={workItemId}
          customButton={
            <IssueDetailWidgetButton
              title={t("issue.pages.link_pages")}
              icon={<FileText className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
              disabled={disabled}
            />
          }
        />
      )}
    </>
  );
};
