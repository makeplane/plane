import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
import { PlusIcon } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useToast from "hooks/use-toast";
import useKeypress from "hooks/use-keypress";
import useProjectDetails from "hooks/use-project-details";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
import { createIssuePayload } from "helpers/issue.helper";
// types
import { IIssue } from "types";

type Props = {
  prePopulatedData?: Partial<IIssue>;
  onSuccess?: (data: IIssue) => Promise<void> | void;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: IIssue,
    viewId?: string
  ) => Promise<IIssue | undefined>;
  viewId?: string;
};

const defaultValues: Partial<IIssue> = {
  name: "",
};

const Inputs = (props: any) => {
  const { register, setFocus } = props;

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  return (
    <input
      type="text"
      autoComplete="off"
      placeholder="Issue Title"
      {...register("name", {
        required: "Issue title is required.",
      })}
      className="w-full rounded-md bg-transparent px-2 text-sm font-medium leading-5 text-custom-text-200 outline-none"
    />
  );
};

export const GanttInlineCreateIssueForm: React.FC<Props> = observer((props) => {
  const { prePopulatedData, quickAddCallback, viewId } = props;

  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  // store
  const { workspace: workspaceStore } = useMobxStore();

  const { projectDetails } = useProjectDetails();

  const {
    reset,
    handleSubmit,
    setFocus,
    register,
    formState: { errors, isSubmitting },
  } = useForm<IIssue>({ defaultValues });

  // ref
  const ref = useRef<HTMLFormElement>(null);

  // states
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => setIsOpen(false);

  // hooks
  useKeypress("Escape", handleClose);
  useOutsideClickDetector(ref, handleClose);
  const { setToastAlert } = useToast();

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

  const onSubmitHandler = async (formData: IIssue) => {
    if (isSubmitting || !workspaceSlug || !projectId) return;

    // resetting the form so that user can add another issue quickly
    reset({ ...defaultValues, ...(prePopulatedData ?? {}) });

    const payload = createIssuePayload(workspaceDetail!, projectDetails!, {
      ...(prePopulatedData ?? {}),
      ...formData,
      start_date: renderFormattedPayloadDate(new Date()),
      target_date: renderFormattedPayloadDate(new Date(new Date().getTime() + 24 * 60 * 60 * 1000)),
    });

    try {
      if (quickAddCallback) {
        await quickAddCallback(workspaceSlug, projectId, payload, viewId);
      }
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
        <form
          ref={ref}
          className="mr-2.5 flex items-center gap-x-2 rounded border-[0.5px] border-custom-border-100 bg-custom-background-100 px-2 py-3 shadow-custom-shadow-2xs"
          onSubmit={handleSubmit(onSubmitHandler)}
        >
          <div className="h-3 w-3 flex-shrink-0 rounded-full border border-custom-border-1000" />
          <h4 className="text-xs text-custom-text-400">{projectDetails?.identifier ?? "..."}</h4>
          <Inputs register={register} setFocus={setFocus} />
        </form>
      )}

      {isOpen && (
        <p className="ml-3 mt-3 text-xs italic text-custom-text-200">
          Press {"'"}Enter{"'"} to add another issue
        </p>
      )}

      {!isOpen && (
        <button
          type="button"
          className="flex items-center gap-x-[6px] rounded-md px-2 py-1 text-custom-primary-100"
          onClick={() => setIsOpen(true)}
        >
          <PlusIcon className="h-3.5 w-3.5 stroke-2" />
          <span className="text-sm font-medium text-custom-primary-100">New Issue</span>
        </button>
      )}
    </>
  );
});
