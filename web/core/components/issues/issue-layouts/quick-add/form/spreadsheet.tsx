import { FC } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { TQuickAddIssueForm } from "../root";

export const SpreadsheetQuickAddIssueForm: FC<TQuickAddIssueForm> = observer((props) => {
  const { ref, projectDetail, register, onSubmit, isEpic } = props;
  const { t } = useTranslation();
  return (
    <div className="pb-2">
      <form
        ref={ref}
        onSubmit={onSubmit}
        className="z-10 flex items-center gap-x-5 border-[0.5px] border-t-0 border-custom-border-100 bg-custom-background-100 px-4 shadow-custom-shadow-sm"
      >
        <h4 className="w-20 text-xs leading-5 text-custom-text-400">{projectDetail?.identifier ?? "..."}</h4>
        <input
          type="text"
          autoComplete="off"
          placeholder={isEpic ? t("epic.title.label") : t("issue.title.label")}
          {...register("name", {
            required: isEpic ? t("epic.title.required") : t("issue.title.required"),
          })}
          className="w-full rounded-md bg-transparent py-3 text-sm leading-5 text-custom-text-200 outline-none"
        />
      </form>
      <p className="ml-3 mt-3 text-xs italic text-custom-text-200">
        {isEpic ? t("epic.add.press_enter") : t("issue.add.press_enter")}
      </p>
    </div>
  );
});
