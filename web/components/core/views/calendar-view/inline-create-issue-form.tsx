import { useEffect, useRef, useState } from "react";

// next
import { useRouter } from "next/router";

// react hook form
import { useFormContext } from "react-hook-form";

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
  dependencies: any[];
};

const useCheckIfThereIsSpaceOnRight = (ref: React.RefObject<HTMLDivElement>, deps: any[]) => {
  const [isThereSpaceOnRight, setIsThereSpaceOnRight] = useState(true);

  const router = useRouter();
  const { moduleId, cycleId, viewId } = router.query;

  const container = document.getElementById(`calendar-view-${cycleId ?? moduleId ?? viewId}`);

  useEffect(() => {
    if (!ref.current) return;

    const { right } = ref.current.getBoundingClientRect();

    const width = right;

    const innerWidth = container?.getBoundingClientRect().width ?? window.innerWidth;

    if (width > innerWidth) setIsThereSpaceOnRight(false);
    else setIsThereSpaceOnRight(true);
  }, [ref, deps, container]);

  return isThereSpaceOnRight;
};

const InlineInput = () => {
  const { projectDetails } = useProjectDetails();

  const { register, setFocus } = useFormContext();

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  return (
    <>
      <h4 className="text-sm font-medium leading-5 text-custom-text-400">
        {projectDetails?.identifier ?? "..."}
      </h4>
      <input
        type="text"
        autoComplete="off"
        placeholder="Issue Title"
        {...register("name", {
          required: "Issue title is required.",
        })}
        className="w-full pr-2 py-2.5 rounded-md bg-transparent text-sm font-medium leading-5 text-custom-text-200 outline-none"
      />
    </>
  );
};

export const CalendarInlineCreateIssueForm: React.FC<Props> = (props) => {
  const { isOpen, dependencies } = props;

  const ref = useRef<HTMLDivElement>(null);

  const isSpaceOnRight = useCheckIfThereIsSpaceOnRight(ref, dependencies);

  return (
    <>
      <div
        ref={ref}
        className={`absolute top-10 transition-all z-20 w-full max-w-[calc(100%-1.25rem)] ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 pointer-events-none scale-95"
        } right-2.5`}
      >
        <InlineCreateIssueFormWrapper
          {...props}
          className="flex w-full px-1.5 border-[0.5px] border-custom-border-100 rounded z-50 items-center gap-x-2 bg-custom-background-100 shadow-custom-shadow-sm transition-opacity"
        >
          <InlineInput />
        </InlineCreateIssueFormWrapper>
      </div>
      {/* Added to make any other element as outside click. This will make input also to be outside. */}
      {isOpen && <div className="w-screen h-screen fixed inset-0 z-10" />}
    </>
  );
};
