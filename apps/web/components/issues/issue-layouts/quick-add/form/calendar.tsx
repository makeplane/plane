/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { useTranslation } from "@plane/i18n";
import type { TQuickAddIssueForm } from "../root";

export const CalendarQuickAddIssueForm = observer(function CalendarQuickAddIssueForm(props: TQuickAddIssueForm) {
  const { ref, isOpen, projectDetail, register, onSubmit, isEpic, hasError } = props;

  const { t } = useTranslation();

  return (
    <div
      className={`z-20 w-full transition-all ${
        isOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
      }`}
    >
      <form
        ref={ref}
        onSubmit={onSubmit}
        className="z-50 flex min-h-10 w-full items-center gap-x-2 rounded-sm border-subtle bg-surface-1 px-3 py-2 transition-opacity md:border-[0.5px] md:shadow-raised-100"
      >
        <h4 className="text-body-xs-regular leading-5 text-placeholder md:text-caption-sm-regular">
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
    </div>
  );
});
