import { FC } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { TQuickAddIssueForm } from "../root";

export const ListQuickAddIssueForm: FC<TQuickAddIssueForm> = observer((props) => {
  const { ref, projectDetail, register, onSubmit, isEpic } = props;
  const { t } = useTranslation();
  return (
    <div className="shadow-custom-shadow-sm">
      <form
        ref={ref}
        onSubmit={onSubmit}
        className="flex w-full items-center gap-x-3 border-[0.5px] border-t-0 border-custom-border-100 bg-custom-background-100 px-3"
      >
        <div className="flex w-full items-center gap-3">
          <div className="text-xs font-medium text-custom-text-400">{projectDetail?.identifier ?? "..."}</div>
          <input
            type="text"
            autoComplete="off"
            placeholder={isEpic ? t("epic_title") : t("issue_title")}
            {...register("name", {
              required: `${isEpic ? t("epic") : t("issue")} ${t("title_is_required")}.`,
            })}
            className="w-full rounded-md bg-transparent px-2 py-3 text-sm font-medium leading-5 text-custom-text-200 outline-none"
          />
        </div>
      </form>
      <div className="px-3 py-2 text-xs italic text-custom-text-200">
        {t("press_enter_to_add_another_entity", { entity: isEpic ? t("epic") : t("issue") })}
      </div>
    </div>
  );
});
