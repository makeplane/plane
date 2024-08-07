import { FC } from "react";
import { observer } from "mobx-react";
import { TQuickAddIssueForm } from "../root";

export const CalendarQuickAddIssueForm: FC<TQuickAddIssueForm> = observer((props) => {
  const { ref, isOpen, projectDetail, register, onSubmit } = props;

  return (
    <div
      className={`z-20 w-full transition-all ${isOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
    >
      <form
        ref={ref}
        onSubmit={onSubmit}
        className="z-50 flex w-full items-center gap-x-2 rounded md:border-[0.5px] border-custom-border-200 bg-custom-background-100 px-2 md:shadow-custom-shadow-2xs transition-opacity"
      >
        <h4 className="text-sm md:text-xs leading-5 text-custom-text-400">{projectDetail?.identifier ?? "..."}</h4>
        <input
          type="text"
          autoComplete="off"
          placeholder="Issue Title"
          {...register("name", {
            required: "Issue title is required.",
          })}
          className="w-full rounded-md bg-transparent py-1.5 pr-2 text-sm md:text-xs font-medium leading-5 text-custom-text-200 outline-none"
        />
      </form>
    </div>
  );
});
