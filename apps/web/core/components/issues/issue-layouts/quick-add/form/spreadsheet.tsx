import type { FC } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { TQuickAddIssueForm } from "../root";

export const SpreadsheetQuickAddIssueForm = observer(function SpreadsheetQuickAddIssueForm(props: TQuickAddIssueForm) {
  const { ref, projectDetail, register, onSubmit, isEpic } = props;
  const { t } = useTranslation();
  return (
    <div className="pb-2">
      <form
        ref={ref}
        onSubmit={onSubmit}
        className="z-10 flex items-center gap-x-5 border-[0.5px] border-t-0 border-subtle bg-surface-1 px-4 shadow-raised-200"
      >
        <h4 className="w-20 text-11 leading-5 text-placeholder">{projectDetail?.identifier ?? "..."}</h4>
        <input
          type="text"
          autoComplete="off"
          placeholder={isEpic ? t("epic.title.label") : t("issue.title.label")}
          {...register("name", {
            required: isEpic ? t("epic.title.required") : t("issue.title.required"),
          })}
          className="w-full rounded-md bg-transparent py-3 text-13 leading-5 text-secondary outline-none"
        />
      </form>
      <p className="ml-3 mt-3 text-11 italic text-secondary">
        {isEpic ? t("epic.add.press_enter") : t("issue.add.press_enter")}
      </p>
    </div>
  );
});
