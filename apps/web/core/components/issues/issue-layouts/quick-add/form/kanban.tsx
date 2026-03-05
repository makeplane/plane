/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { TQuickAddIssueForm } from "../root";

export const KanbanQuickAddIssueForm = observer(function KanbanQuickAddIssueForm(props: TQuickAddIssueForm) {
  const { ref, projectDetail, register, onSubmit, isEpic } = props;
  const { t } = useTranslation();
  return (
    <div className="m-1 overflow-hidden rounded-sm bg-layer-2 shadow-raised-200">
      <form ref={ref} onSubmit={onSubmit} className="flex w-full items-center gap-x-3 p-3">
        <div className="w-full">
          <h4 className="text-11 leading-5 font-medium text-tertiary">{projectDetail?.identifier ?? "..."}</h4>
          <input
            autoComplete="off"
            placeholder={isEpic ? t("epic.title.label") : t("issue.title.label")}
            {...register("name", {
              required: isEpic ? t("epic.title.required") : t("issue.title.required"),
            })}
            className="w-full rounded-md bg-transparent px-2 py-1.5 pl-0 text-13 leading-5 font-medium text-secondary outline-none"
          />
        </div>
      </form>
      <div className="bg-layer-3 px-3 py-2 text-11 text-tertiary italic">
        {isEpic ? t("epic.add.press_enter") : t("issue.add.press_enter")}
      </div>
    </div>
  );
});
