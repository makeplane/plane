/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import type { Control } from "react-hook-form";
import { Controller, useFormContext } from "react-hook-form";
// types
import type { TIssue } from "@plane/types";
// ui
import { useTranslation } from "@plane/i18n";
import { SearchIcon } from "@plane/propel/icons";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useIssueFormValidation } from "@/hooks/store/use-issue-form-validation";
import { useTaskCategory } from "@/hooks/store/use-task-category";

type TTaskCategoryFieldsProps = {
  control: Control<TIssue>;
  handleFormChange: () => void;
};

export const TaskCategoryFields = observer(function TaskCategoryFields(props: TTaskCategoryFieldsProps) {
  const { control, handleFormChange } = props;
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { t } = useTranslation();

  // store hooks
  const { mainCategoryIds, mainCategories, getSubCategoriesByMain, fetchCategories } = useTaskCategory();
  const { getTaskCategoryFieldRules } = useIssueFormValidation();

  const [mainQuery, setMainQuery] = useState("");
  const [subQuery, setSubQuery] = useState("");

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

  const filteredMainIds = mainQuery
    ? mainCategoryIds.filter((id) => mainCategories[id]?.name?.toLowerCase().includes(mainQuery.toLowerCase()))
    : mainCategoryIds;

  const filteredSubCategories = subQuery
    ? subCategories.filter((s) => s.name?.toLowerCase().includes(subQuery.toLowerCase()))
    : subCategories;

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
              label={value ? (mainCategories[value]?.name ?? t("task_category.main_label")) : t("task_category.main_label")}
              noBorder
              buttonClassName="h-7 rounded-sm border-[0.5px] border-strong px-2 text-caption-sm-regular hover:bg-layer-1"
              placement="bottom-start"
              closeOnSelect
              onMenuClose={() => setMainQuery("")}
            >
              {/* Search input — stopPropagation prevents closeOnSelect from firing on input click */}
              <div className="px-1 pb-1.5" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1.5 rounded-sm border border-subtle bg-layer-2 px-2">
                  <SearchIcon className="h-3.5 w-3.5 shrink-0 text-placeholder" />
                  <input
                    type="text"
                    className="w-full bg-transparent py-1 text-xs text-secondary placeholder:text-placeholder focus:outline-none"
                    placeholder={t("task_category.search")}
                    value={mainQuery}
                    onChange={(e) => setMainQuery(e.target.value)}
                  />
                </div>
              </div>
              {filteredMainIds.map((id) => (
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
              {filteredMainIds.length === 0 && (
                <div className="px-2 py-1.5 text-xs italic text-placeholder" onClick={(e) => e.stopPropagation()}>
                  {t("no_matching_results")}
                </div>
              )}
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
                  label={value ? (subMap[value]?.name ?? t("task_category.sub_label")) : t("task_category.sub_label")}
                  noBorder
                  buttonClassName="h-7 rounded-sm border-[0.5px] border-strong px-2 text-caption-sm-regular hover:bg-layer-1"
                  placement="bottom-start"
                  closeOnSelect
                  onMenuClose={() => setSubQuery("")}
                >
                  {/* Search input — stopPropagation prevents closeOnSelect from firing on input click */}
                  <div className="px-1 pb-1.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 rounded-sm border border-subtle bg-layer-2 px-2">
                      <SearchIcon className="h-3.5 w-3.5 shrink-0 text-placeholder" />
                      <input
                        type="text"
                        className="w-full bg-transparent py-1 text-xs text-secondary placeholder:text-placeholder focus:outline-none"
                        placeholder={t("task_category.search")}
                        value={subQuery}
                        onChange={(e) => setSubQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  {filteredSubCategories.map((sub) => (
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
                  {filteredSubCategories.length === 0 && (
                    <div className="px-2 py-1.5 text-xs italic text-placeholder" onClick={(e) => e.stopPropagation()}>
                      {t("no_matching_results")}
                    </div>
                  )}
                </CustomMenu>
              </div>
            );
          }}
        />
      )}
    </>
  );
});
