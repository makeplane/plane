/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type { Control } from "react-hook-form";
import { Controller, useFormContext } from "react-hook-form";
// types
import type { TIssue } from "@plane/types";
// ui
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useTaskCategory } from "@/hooks/store/use-task-category";
import { useIssueFormValidation } from "@/hooks/store/use-issue-form-validation";

type TTaskCategoryFieldsProps = {
  control: Control<TIssue>;
  handleFormChange: () => void;
};

export const TaskCategoryFields = observer(function TaskCategoryFields(props: TTaskCategoryFieldsProps) {
  const { control, handleFormChange } = props;
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();

  // store hooks
  const { mainCategoryIds, mainCategories, getSubCategoriesByMain, fetchCategories } = useTaskCategory();
  const { getTaskCategoryFieldRules } = useIssueFormValidation();

  useEffect(() => {
    if (workspaceSlug) void fetchCategories(workspaceSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  // form context
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<TIssue>();

  const categoriesExist = mainCategoryIds.length > 0;
  if (!categoriesExist) return null;

  const selectedMainId = watch("main_task_category_id");
  const subCategories = selectedMainId ? getSubCategoriesByMain(selectedMainId) : [];

  return (
    <>
      {/* Main Task Category */}
      <Controller
        control={control}
        name="main_task_category_id"
        rules={getTaskCategoryFieldRules({ required: "Category is required" }, categoriesExist)}
        render={({ field: { value, onChange } }) => (
          <div
            className={cn("h-7 rounded-sm", errors.main_task_category_id && "outline outline-1 outline-danger-strong")}
          >
            <CustomMenu
              label={value ? (mainCategories[value]?.name ?? "Category") : "Category"}
              noBorder
              buttonClassName="h-7 rounded-sm border-[0.5px] border-strong px-2 text-caption-sm-regular hover:bg-layer-1"
              placement="bottom-start"
              closeOnSelect
            >
              {mainCategoryIds.map((id) => (
                <CustomMenu.MenuItem
                  key={id}
                  onClick={() => {
                    onChange(id);
                    setValue("sub_task_category_id", null);
                    handleFormChange();
                  }}
                >
                  {mainCategories[id]?.name}
                </CustomMenu.MenuItem>
              ))}
            </CustomMenu>
          </div>
        )}
      />

      {/* Sub Task Category — shown only when a main category is selected */}
      {selectedMainId && subCategories.length > 0 && (
        <Controller
          control={control}
          name="sub_task_category_id"
          rules={getTaskCategoryFieldRules({ required: "Sub-category is required" }, categoriesExist)}
          render={({ field: { value, onChange } }) => {
            const subMap = Object.fromEntries(subCategories.map((s) => [s.id, s]));
            return (
              <div
                className={cn(
                  "h-7 rounded-sm",
                  errors.sub_task_category_id && "outline outline-1 outline-danger-strong"
                )}
              >
                <CustomMenu
                  label={value ? (subMap[value]?.name ?? "Sub-category") : "Sub-category"}
                  noBorder
                  buttonClassName="h-7 rounded-sm border-[0.5px] border-strong px-2 text-caption-sm-regular hover:bg-layer-1"
                  placement="bottom-start"
                  closeOnSelect
                >
                  {subCategories.map((sub) => (
                    <CustomMenu.MenuItem
                      key={sub.id}
                      onClick={() => {
                        onChange(sub.id);
                        handleFormChange();
                      }}
                    >
                      {sub.name}
                    </CustomMenu.MenuItem>
                  ))}
                </CustomMenu>
              </div>
            );
          }}
        />
      )}
    </>
  );
});
