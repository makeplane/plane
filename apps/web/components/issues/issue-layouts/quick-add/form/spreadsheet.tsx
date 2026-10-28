/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { useTranslation } from "@plane/i18n";
import type { TQuickAddIssueForm } from "../root";

export const SpreadsheetQuickAddIssueForm = observer(function SpreadsheetQuickAddIssueForm(props: TQuickAddIssueForm) {
  const { ref, projectDetail, register, onSubmit, isEpic, hasError } = props;
  const { t } = useTranslation();
  return (
    <div className="pb-2">
      <form
        ref={ref}
        onSubmit={onSubmit}
        className="z-10 flex min-h-12 items-center gap-x-3 border-[0.5px] border-t-0 border-subtle bg-surface-1 px-4 py-2 shadow-raised-200"
      >
        <h4 className="w-20 text-caption-sm-regular leading-5 text-placeholder">
          {projectDetail?.identifier ?? "..."}
        </h4>
        <InputGroup size="lg">
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
        </InputGroup>
      </form>
      <p className="px-4 pt-2 text-caption-sm-regular text-secondary italic">
        {isEpic ? t("epic.add.press_enter") : t("issue.add.press_enter")}
      </p>
    </div>
  );
});
