import { FC } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { TQuickAddIssueForm } from "../root";

export const KanbanQuickAddIssueForm: FC<TQuickAddIssueForm> = observer((props) => {
  const { ref, projectDetail, register, onSubmit, isEpic } = props;
  const { t } = useTranslation();
  return (
    <div className="m-1 overflow-hidden rounded shadow-custom-shadow-sm">
      <form ref={ref} onSubmit={onSubmit} className="flex w-full items-center gap-x-3 bg-custom-background-100 p-3">
        <div className="w-full">
          <h4 className="text-xs font-medium leading-5 text-custom-text-300">{projectDetail?.identifier ?? "..."}</h4>
          <input
            autoComplete="off"
            placeholder={isEpic ? t("epic.title.label") : t("issue.title.label")}
            {...register("name", {
              required: isEpic ? t("epic.title.required") : t("issue.title.required"),
            })}
            className="w-full rounded-md bg-transparent px-2 py-1.5 pl-0 text-sm font-medium leading-5 text-custom-text-200 outline-none"
          />
        </div>
      </form>
      <div className="px-3 py-2 text-xs italic text-custom-text-200">
        {isEpic ? t("epic.add.press_enter") : t("issue.add.press_enter")}
      </div>
    </div>
  );
});
