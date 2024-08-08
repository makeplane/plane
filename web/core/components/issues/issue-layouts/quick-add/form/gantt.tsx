import { FC } from "react";
import { observer } from "mobx-react";
import { cn } from "@/helpers/common.helper";
import { TQuickAddIssueForm } from "../root";

export const GanttQuickAddIssueForm: FC<TQuickAddIssueForm> = observer((props) => {
  const { ref, projectDetail, hasError, register, onSubmit } = props;

  return (
    <div className={cn("shadow-custom-shadow-sm", hasError && "border border-red-500/20 bg-red-500/10")}>
      <form
        ref={ref}
        onSubmit={onSubmit}
        className="flex w-full items-center gap-x-3 border-[0.5px] border-custom-border-100 bg-custom-background-100 px-3"
      >
        <div className="flex w-full items-center gap-3">
          <div className="text-xs font-medium text-custom-text-400">{projectDetail?.identifier ?? "..."}</div>
          <input
            type="text"
            autoComplete="off"
            placeholder="Issue Title"
            {...register("name", {
              required: "Issue title is required.",
            })}
            className="w-full rounded-md bg-transparent px-2 py-3 text-sm font-medium leading-5 text-custom-text-200 outline-none"
          />
        </div>
      </form>
      <div className="px-3 py-2 text-xs bg-custom-background-100 italic text-custom-text-200">{`Press 'Enter' to add another issue`}</div>
    </div>
  );
});
