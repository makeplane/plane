/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { truncateProjectIdentifierForDisplay } from "@plane/utils";
import type { TQuickAddIssueForm } from "../root";

export const KanbanQuickAddIssueForm = observer(function KanbanQuickAddIssueForm(props: TQuickAddIssueForm) {
  const { ref, projectDetail, register, onSubmit, isEpic } = props;
  const { t } = useTranslation();
  return (
    <div className="m-1 overflow-hidden rounded-sm shadow-raised-200 bg-layer-2">
      <form ref={ref} onSubmit={onSubmit} className="flex w-full items-center gap-x-3 p-3">
        <div className="w-full">
          <h4 className="text-11 font-medium leading-5 text-tertiary">
            {projectDetail?.identifier ? truncateProjectIdentifierForDisplay(projectDetail.identifier) : "..."}
          </h4>
          <input
            autoComplete="off"
            placeholder={isEpic ? t("epic.title.label") : t("issue.title.label")}
            {...register("name", {
              required: isEpic ? t("epic.title.required") : t("issue.title.required"),
            })}
            className="w-full rounded-md bg-transparent px-2 py-1.5 pl-0 text-13 font-medium leading-5 text-secondary outline-none"
          />
        </div>
      </form>
      <div className="px-3 py-2 text-11 italic text-tertiary bg-layer-3">
        {isEpic ? t("epic.add.press_enter") : t("issue.add.press_enter")}
      </div>
    </div>
  );
});
