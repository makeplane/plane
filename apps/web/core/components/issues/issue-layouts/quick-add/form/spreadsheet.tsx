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
        className="z-10 flex items-center gap-x-5 border-[0.5px] border-t-0 border-subtle bg-custom-background-100 px-4 shadow-custom-shadow-sm"
      >
        <h4 className="w-20 text-xs leading-5 text-placeholder">{projectDetail?.identifier ?? "..."}</h4>
        <input
          type="text"
          autoComplete="off"
          placeholder={isEpic ? t("epic.title.label") : t("issue.title.label")}
          {...register("name", {
            required: isEpic ? t("epic.title.required") : t("issue.title.required"),
          })}
          className="w-full rounded-md bg-transparent py-3 text-sm leading-5 text-secondary outline-none"
        />
      </form>
      <p className="ml-3 mt-3 text-xs italic text-secondary">
        {isEpic ? t("epic.add.press_enter") : t("issue.add.press_enter")}
      </p>
    </div>
  );
});
