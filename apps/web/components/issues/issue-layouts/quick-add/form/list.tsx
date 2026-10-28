/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Input } from "@makeplane/propel/components/input";
import { useTranslation } from "@plane/i18n";
import type { TQuickAddIssueForm } from "../root";

export const ListQuickAddIssueForm = observer(function ListQuickAddIssueForm(props: TQuickAddIssueForm) {
  const { ref, projectDetail, register, onSubmit, isEpic, hasError } = props;
  const { t } = useTranslation();
  return (
    <form
      ref={ref}
      onSubmit={onSubmit}
      className="flex min-h-12 w-full items-center gap-3 border-b border-subtle bg-surface-1 px-page-x py-2"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="shrink-0 text-caption-sm-medium text-placeholder">{projectDetail?.identifier ?? "..."}</div>
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
