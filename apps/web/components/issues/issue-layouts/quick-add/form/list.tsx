/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Input } from "@makeplane/propel/components/input";
import { useTranslation } from "@plane/i18n";
import { calculateIdentifierWidth } from "../../utils";
import type { TQuickAddIssueForm } from "../root";

export const ListQuickAddIssueForm = observer(function ListQuickAddIssueForm(props: TQuickAddIssueForm) {
  const { ref, projectDetail, register, onSubmit, isEpic, hasError } = props;
  const { t } = useTranslation();
  // same identifier column width as the list rows, so the title input lines up with row titles
  const identifierWidth = projectDetail
    ? calculateIdentifierWidth(projectDetail.identifier?.length ?? 0, projectDetail.next_work_item_sequence ?? 1)
    : undefined;

  return (
    <form
      ref={ref}
      onSubmit={onSubmit}
      className="flex min-h-12 w-full items-center gap-3 border-b border-subtle bg-surface-1 px-page-x py-2"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex shrink-0 items-center gap-1">
          <div className="text-caption-sm-medium text-placeholder" style={{ minWidth: identifierWidth }}>
            {projectDetail?.identifier ?? "..."}
          </div>
          {/* stands in for the rows' sub-work-item chevron */}
          <div aria-hidden="true" className="size-4 shrink-0" />
        </div>
        <Input
          size="md"
          type="text"
          autoComplete="off"
          aria-label={isEpic ? t("epic.title.label") : t("issue.title.label")}
          aria-invalid={hasError}
          data-invalid={hasError || undefined}
          placeholder={isEpic ? t("epic.title.label") : t("issue.title.label")}
          {...register("name", {
            required: isEpic ? t("epic.title.required") : t("issue.title.required"),
          })}
        />
      </div>
      <span className="hidden shrink-0 text-caption-sm-regular text-secondary italic md:block">
        {isEpic ? t("epic.add.press_enter") : t("issue.add.press_enter")}
      </span>
    </form>
  );
});
