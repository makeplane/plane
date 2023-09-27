import { useEffect } from "react";

// react hook form
import { useFormContext } from "react-hook-form";

// hooks
import useProjectDetails from "hooks/use-project-details";

// components
import { InlineCreateIssueFormWrapper } from "components/core";

// types
import { IIssue } from "types";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  onSuccess?: (data: IIssue) => Promise<void> | void;
  prePopulatedData?: Partial<IIssue>;
};

const InlineInput = () => {
  const { projectDetails } = useProjectDetails();

  const { register, setFocus } = useFormContext();

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  return (
    <>
      <div className="w-[14px] h-[14px] rounded-full border border-custom-border-1000 flex-shrink-0" />
      <h4 className="text-sm text-custom-text-400">{projectDetails?.identifier ?? "..."}</h4>
      <input
        type="text"
        autoComplete="off"
        placeholder="Issue Title"
        {...register("name", {
          required: "Issue title is required.",
        })}
        className="w-full px-2 rounded-md bg-transparent text-sm font-medium leading-5 text-custom-text-200 outline-none"
      />
    </>
  );
};

export const GanttInlineCreateIssueForm: React.FC<Props> = (props) => (
  <>
    <InlineCreateIssueFormWrapper
      className="flex py-3 px-4 mr-2.5 items-center rounded gap-x-2 border bg-custom-background-100 shadow-custom-shadow-sm"
      {...props}
    >
      <InlineInput />
    </InlineCreateIssueFormWrapper>
    {props.isOpen && (
      <p className="text-xs ml-3 mt-3 italic text-custom-text-200">
        Press {"'"}Enter{"'"} to add another issue
      </p>
    )}
  </>
);
