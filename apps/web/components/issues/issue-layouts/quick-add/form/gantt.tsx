/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Input } from "@makeplane/propel/components/input";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import type { TQuickAddIssueForm } from "../root";

export const GanttQuickAddIssueForm = observer(function GanttQuickAddIssueForm(props: TQuickAddIssueForm) {
  const { ref, projectDetail, hasError, register, onSubmit, isEpic } = props;
  const { t } = useTranslation();
  return (
    <div className={cn("shadow-raised-200", hasError && "border border-danger-strong/20 bg-danger-subtle")}>
      <form
        ref={ref}
        onSubmit={onSubmit}
        className="flex min-h-12 w-full items-center border-[0.5px] border-subtle bg-surface-1 px-4 py-2"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="shrink-0 text-caption-sm-medium text-placeholder">{projectDetail?.identifier ?? "..."}</div>
          <Input
            size="lg"
            aria-label={isEpic ? t("epic.title.label") : t("issue.title.label")}
            aria-invalid={hasError}
            data-invalid={hasError || undefined}
            type="text"
            autoComplete="off"
            placeholder={isEpic ? t("epic.title.label") : t("issue.title.label")}
            {...register("name", {
              required: isEpic ? t("epic.title.required") : t("issue.title.required"),
            })}
          />
        </div>
      </form>
      <div className="bg-surface-1 px-4 py-2 text-caption-sm-regular text-secondary italic">
        {isEpic ? t("epic.add.press_enter") : t("issue.add.press_enter")}
      </div>
    </div>
  );
});
