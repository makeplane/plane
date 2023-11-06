import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";

// store
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";

// hooks
import useToast from "hooks/use-toast";
import useKeypress from "hooks/use-keypress";
import useProjectDetails from "hooks/use-project-details";
import useOutsideClickDetector from "hooks/use-outside-click-detector";

// constants
import { createIssuePayload } from "constants/issue";

// icons
import { PlusIcon } from "lucide-react";

// types
import { IIssue } from "types";

type Props = {
  groupId?: string;
  dependencies?: any[];
  prePopulatedData?: Partial<IIssue>;
  onSuccess?: (data: IIssue) => Promise<void> | void;
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

const defaultValues: Partial<IIssue> = {
  name: "",
};

const Inputs = (props: any) => {
  const { register, setFocus, projectDetails } = props;

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  return (
    <>
      <h4 className="text-xs leading-5 text-custom-text-400">{projectDetails?.identifier ?? "..."}</h4>
      <input
        type="text"
        autoComplete="off"
        placeholder="Issue Title"
        {...register("name", {
          required: "Issue title is required.",
        })}
        className="w-full pr-2 py-1.5 rounded-md bg-transparent text-xs font-medium leading-5 text-custom-text-200 outline-none"
      />
    </>
  );
};

export const CalendarInlineCreateIssueForm: React.FC<Props> = observer((props) => {
  const { prePopulatedData, dependencies = [], groupId } = props;

  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // store
  const { workspace: workspaceStore, quickAddIssue: quickAddStore } = useMobxStore();

  // ref
  const ref = useRef<HTMLDivElement>(null);

  // states
  const [isOpen, setIsOpen] = useState(false);

  const { setToastAlert } = useToast();

  const { projectDetails } = useProjectDetails();

  const {
    reset,
    handleSubmit,
    register,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<IIssue>({ defaultValues });

  const handleClose = () => {
    setIsOpen(false);
  };

  useKeypress("Escape", handleClose);
  useOutsideClickDetector(ref, handleClose);

  // derived values
  const workspaceDetail = workspaceStore.getWorkspaceBySlug(workspaceSlug?.toString()!);

  useEffect(() => {
    if (!isOpen) reset({ ...defaultValues });
  }, [isOpen, reset]);

  useEffect(() => {
    if (!errors) return;

    Object.keys(errors).forEach((key) => {
      const error = errors[key as keyof IIssue];

      setToastAlert({
        type: "error",
        title: "Error!",
        message: error?.message?.toString() || "Some error occurred. Please try again.",
      });
    });
  }, [errors, setToastAlert]);

  const isSpaceOnRight = useCheckIfThereIsSpaceOnRight(ref, dependencies);

  const onSubmitHandler = async (formData: IIssue) => {
    if (isSubmitting || !workspaceSlug || !projectId) return;

    // resetting the form so that user can add another issue quickly
    reset({ ...defaultValues, ...(prePopulatedData ?? {}) });

    const payload = createIssuePayload(workspaceDetail!, projectDetails!, {
      ...(prePopulatedData ?? {}),
      ...formData,
    });

    try {
      quickAddStore.createIssue(
        workspaceSlug.toString(),
        projectId.toString(),
        {
          group_id: groupId ?? null,
          sub_group_id: null,
        },
        payload
      );

      setToastAlert({
        type: "success",
        title: "Success!",
        message: "Issue created successfully.",
      });
    } catch (err: any) {
      Object.keys(err || {}).forEach((key) => {
        const error = err?.[key];
        const errorTitle = error ? (Array.isArray(error) ? error.join(", ") : error) : null;

        setToastAlert({
          type: "error",
          title: "Error!",
          message: errorTitle || "Some error occurred. Please try again.",
        });
      });
    }
  };

  return (
    <>
      {isOpen && (
        <div
          ref={ref}
          className={`transition-all z-20 w-full ${
            isOpen ? "opacity-100 scale-100" : "opacity-0 pointer-events-none scale-95"
          }`}
        >
          <form
            onSubmit={handleSubmit(onSubmitHandler)}
            className="flex w-full px-2 border-[0.5px] border-custom-border-200 rounded z-50 items-center gap-x-2 bg-custom-background-100 shadow-custom-shadow-2xs transition-opacity"
          >
            <Inputs register={register} setFocus={setFocus} projectDetails={projectDetails} />
          </form>
        </div>
      )}

      {!isOpen && (
        <div className="hidden group-hover:block border-[0.5px] border-custom-border-200 rounded">
          <button
            type="button"
            className="w-full flex items-center gap-x-[6px] text-custom-primary-100 px-2 py-1.5 rounded-md"
            onClick={() => setIsOpen(true)}
          >
            <PlusIcon className="h-3.5 w-3.5 stroke-2" />
            <span className="text-sm font-medium text-custom-primary-100">New Issue</span>
          </button>
        </div>
      )}
    </>
  );
});
