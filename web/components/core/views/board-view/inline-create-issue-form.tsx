import { useEffect } from "react";

// react hook form
import { useFormContext } from "react-hook-form";

// components
import { InlineCreateIssueFormWrapper } from "components/core";

// hooks
import useProjectDetails from "hooks/use-project-details";

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
    <div>
      <h4 className="text-sm font-medium leading-5 text-custom-text-300">
        {projectDetails?.identifier ?? "..."}
      </h4>
      <input
        autoComplete="off"
        placeholder="Issue Title"
        {...register("name", {
          required: "Issue title is required.",
        })}
        className="w-full px-2 pl-0 py-1.5 rounded-md bg-transparent text-sm font-medium leading-5 text-custom-text-200 outline-none"
      />
    </div>
  );
};

export const BoardInlineCreateIssueForm: React.FC<Props> = (props) => (
  <>
    <InlineCreateIssueFormWrapper
      className="flex flex-col justify-between gap-1.5 group/card relative select-none px-3.5 py-3 h-[118px] mb-3 rounded bg-custom-background-100 shadow-custom-shadow-sm"
      {...props}
    >
      <InlineInput />
    </InlineCreateIssueFormWrapper>
    {props.isOpen && (
      <p className="text-xs ml-3 italic text-custom-text-200">
        Press {"'"}Enter{"'"} to add another issue
      </p>
    )}
  </>
);
