import { useEffect } from "react";
import { observer } from "mobx-react";
import { LayoutGrid, Tag } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { CustomMenu } from "@plane/ui";
import { useTaskCategory } from "@/hooks/store/use-task-category";
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import type { TIssueOperations } from "@/components/issues/issue-detail/root";
import type { TIssue } from "@plane/types";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issue: TIssue;
  issueOperations: TIssueOperations;
  isEditable: boolean;
};

export const TaskCategoryProperty = observer(function TaskCategoryProperty(props: Props) {
  const { workspaceSlug, projectId, issueId, issue, issueOperations, isEditable } = props;
  const { t } = useTranslation();

  const { mainCategoryIds, mainCategories, getSubCategoriesByMain, fetchCategories } = useTaskCategory();

  useEffect(() => {
    void fetchCategories(workspaceSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  if (mainCategoryIds.length === 0) return null;

  const selectedMainId = issue.main_task_category_id;
  const subCategories = selectedMainId ? getSubCategoriesByMain(selectedMainId) : [];
  const selectedMain = selectedMainId ? mainCategories[selectedMainId] : null;

  const handleMainChange = (id: string) => {
    void issueOperations.update(workspaceSlug, projectId, issueId, {
      main_task_category_id: id,
      sub_task_category_id: null, // reset sub when main changes
    });
  };

  const handleSubChange = (id: string) => {
    void issueOperations.update(workspaceSlug, projectId, issueId, { sub_task_category_id: id });
  };

  return (
    <>
      {/* Main Task Category */}
      <SidebarPropertyListItem icon={LayoutGrid} label={t("task_category.main_label")}>
        <CustomMenu
          label={selectedMain?.name ?? t("task_category.select_main")}
          buttonClassName="h-7.5 w-full text-left text-body-xs-regular text-placeholder data-[has-value=true]:text-primary px-2"
          placement="bottom-start"
          disabled={!isEditable}
        >
          {mainCategoryIds.map((id) => (
            <CustomMenu.MenuItem key={id} onClick={() => handleMainChange(id)}>
              {mainCategories[id]?.name}
            </CustomMenu.MenuItem>
          ))}
        </CustomMenu>
      </SidebarPropertyListItem>

      {/* Sub Task Category — shown only when main has sub-categories */}
      {selectedMainId && subCategories.length > 0 && (
        <SidebarPropertyListItem icon={Tag} label={t("task_category.sub_label")}>
          <CustomMenu
            label={
              issue.sub_task_category_id
                ? (subCategories.find((s) => s.id === issue.sub_task_category_id)?.name ??
                  t("task_category.select_sub"))
                : t("task_category.select_sub")
            }
            buttonClassName="h-7.5 w-full text-left text-body-xs-regular text-placeholder data-[has-value=true]:text-primary px-2"
            placement="bottom-start"
            disabled={!isEditable}
          >
            {subCategories.map((sub) => (
              <CustomMenu.MenuItem key={sub.id} onClick={() => handleSubChange(sub.id)}>
                {sub.name}
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
        </SidebarPropertyListItem>
      )}
    </>
  );
});
