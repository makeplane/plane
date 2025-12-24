import type { FC } from "react";
import { observer } from "mobx-react";
import type { TQuickAddIssueForm } from "../root";

export const CalendarQuickAddIssueForm = observer(function CalendarQuickAddIssueForm(props: TQuickAddIssueForm) {
  const { ref, isOpen, projectDetail, register, onSubmit, isEpic } = props;

  return (
    <div
      className={`z-20 w-full transition-all ${
        isOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
      }`}
    >
      <form
        ref={ref}
        onSubmit={onSubmit}
        className="z-50 flex w-full items-center gap-x-2 rounded-sm md:border-[0.5px] border-subtle bg-surface-1 px-2 md:shadow-raised-100 transition-opacity"
      >
        <h4 className="text-13 md:text-11 leading-5 text-placeholder">{projectDetail?.identifier ?? "..."}</h4>
        <input
          type="text"
          autoComplete="off"
          placeholder={isEpic ? "Epic Title" : "Work item Title"}
          {...register("name", {
            required: `${isEpic ? "Epic" : "Work item"} title is required.`,
          })}
          className="w-full rounded-md bg-transparent py-1.5 pr-2 text-13 md:text-11 font-medium leading-5 text-secondary outline-none"
        />
      </form>
    </div>
  );
});
