/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { useTranslation } from "@plane/i18n";
import type { TQuickAddIssueForm } from "../root";

export const KanbanQuickAddIssueForm = observer(function KanbanQuickAddIssueForm(props: TQuickAddIssueForm) {
  const { ref, projectDetail, register, onSubmit, isEpic, hasError } = props;
  const { t } = useTranslation();
  return (
    <div className="m-1 overflow-hidden rounded-sm bg-layer-2 shadow-raised-200">
      <form ref={ref} onSubmit={onSubmit} className="flex w-full items-center gap-x-3 p-3">
        <div className="flex w-full flex-col gap-1">
          <h4 className="text-caption-sm-medium leading-5 text-tertiary">{projectDetail?.identifier ?? "..."}</h4>
          <InputGroup size="lg">
            <Input
              size="lg"
              aria-label={isEpic ? t("epic.title.label") : t("issue.title.label")}
              aria-invalid={hasError}
              data-invalid={hasError || undefined}
              autoComplete="off"
              placeholder={isEpic ? t("epic.title.label") : t("issue.title.label")}
              {...register("name", {
                required: isEpic ? t("epic.title.required") : t("issue.title.required"),
              })}
            />
          </InputGroup>
        </div>
      </form>
      <div className="bg-layer-3 px-3 py-2 text-caption-sm-regular text-tertiary italic">
        {isEpic ? t("epic.add.press_enter") : t("issue.add.press_enter")}
      </div>
    </div>
  );
});
