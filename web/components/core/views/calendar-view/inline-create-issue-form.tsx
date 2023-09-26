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
        className="w-full px-2 py-1.5 rounded-md bg-transparent text-sm font-medium leading-5 text-custom-text-200 outline-none"
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
        className={`absolute -translate-x-1 top-5 transition-all z-20 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 pointer-events-none scale-95"
        } ${isSpaceOnRight ? "left-full" : "right-0"}`}
      >
        <InlineCreateIssueFormWrapper
          {...props}
          className="flex w-60 p-1 px-1.5 rounded items-center gap-x-3 bg-custom-background-100 shadow-custom-shadow-md transition-opacity"
        >
          <InlineInput />
        </InlineCreateIssueFormWrapper>
      </div>
      {/* Added to make any other element as outside click. This will make input also to be outside. */}
      {isOpen && <div className="w-screen h-screen fixed inset-0 z-10" />}
    </>
  );
};
