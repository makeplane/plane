import { FC } from "react";
import { observer } from "mobx-react";
import { TQuickAddIssueForm } from "../root";

export const ListQuickAddIssueForm: FC<TQuickAddIssueForm> = observer((props) => {
  const { ref, projectDetail, register, onSubmit, isEpic } = props;

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
            placeholder={isEpic ? "Epic Title" : "Issue Title"}
            {...register("name", {
              required: `${isEpic ? "Epic" : "Issue"} title is required.`,
            })}
            className="w-full rounded-md bg-transparent px-2 py-3 text-sm font-medium leading-5 text-custom-text-200 outline-none"
          />
        </div>
      </form>
      <div className="px-3 py-2 text-xs italic text-custom-text-200">{`Press 'Enter' to add another ${isEpic ? "epic" : "issue"}`}</div>
    </div>
  );
});
