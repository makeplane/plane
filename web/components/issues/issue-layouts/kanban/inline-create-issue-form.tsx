import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { PlusIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
// store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useToast from "hooks/use-toast";
import useKeypress from "hooks/use-keypress";
import useProjectDetails from "hooks/use-project-details";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// helpers
import { createIssuePayload } from "helpers/issue.helper";
// types
import { IIssue } from "types";

type Props = {
  groupId?: string;
  subGroupId?: string;
  prePopulatedData?: Partial<IIssue>;
  onSuccess?: (data: IIssue) => Promise<void> | void;
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
    <div>
      <h4 className="text-xs font-medium leading-5 text-custom-text-300">{projectDetails?.identifier ?? "..."}</h4>
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

export const BoardInlineCreateIssueForm: React.FC<Props> = observer((props) => {
  const { prePopulatedData, groupId, subGroupId } = props;

  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // store
  const { workspace: workspaceStore, quickAddIssue: quickAddStore } = useMobxStore();

  // ref
  const ref = useRef<HTMLFormElement>(null);

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
          sub_group_id: subGroupId ?? null,
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
    <div>
      {isOpen && (
        <form
          ref={ref}
          onSubmit={handleSubmit(onSubmitHandler)}
          className="flex flex-col border-[0.5px] border-custom-border-100 justify-between gap-1.5 group/card relative select-none px-3.5 py-3 h-[118px] mb-3 mx-1.5 rounded bg-custom-background-300 shadow-custom-shadow-sm"
        >
          <Inputs register={register} setFocus={setFocus} projectDetails={projectDetails} />
        </form>
      )}

      {isOpen && (
        <p className="text-xs ml-3 italic mb-2 text-custom-text-200">
          Press {"'"}Enter{"'"} to add another issue
        </p>
      )}

      {!isOpen && (
        <button
          type="button"
          className="flex items-center gap-x-[6px] text-custom-primary-100 px-2 py-3 rounded-md"
          onClick={() => setIsOpen(true)}
        >
          <PlusIcon className="h-3.5 w-3.5 stroke-2" />
          <span className="text-sm font-medium text-custom-primary-100">New Issue</span>
        </button>
      )}
    </div>
  );
});
