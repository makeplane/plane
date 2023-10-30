import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { Transition } from "@headlessui/react";

// hooks
import useToast from "hooks/use-toast";
import useKeypress from "hooks/use-keypress";
import useProjectDetails from "hooks/use-project-details";
import useOutsideClickDetector from "hooks/use-outside-click-detector";

// store
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";

// constants
import { createIssuePayload } from "constants/issue";

// types
import { IIssue } from "types";
import { PlusIcon } from "lucide-react";

type Props = {
  groupId?: string;
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
    <>
      <h4 className="text-sm font-medium leading-5 text-custom-text-400">{projectDetails?.identifier ?? "..."}</h4>
      <input
        type="text"
        autoComplete="off"
        placeholder="Issue Title"
        {...register("name", {
          required: "Issue title is required.",
        })}
        className="w-full px-2 py-3 rounded-md bg-transparent text-sm font-medium leading-5 text-custom-text-200 outline-none"
      />
    </>
  );
};

export const ListInlineCreateIssueForm: React.FC<Props> = observer((props) => {
  const { prePopulatedData, groupId } = props;

  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // store
  const { workspace: workspaceStore, quickAddIssue: quickAddStore } = useMobxStore();

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
    reset({ ...defaultValues });

    const payload = createIssuePayload(workspaceDetail!, projectDetails!, {
      ...(prePopulatedData ?? {}),
      ...formData,
      labels_list:
        formData.labels_list?.length !== 0
          ? formData.labels_list
          : prePopulatedData?.labels && prePopulatedData?.labels.toString() !== "none"
          ? [prePopulatedData.labels as any]
          : [],
      assignees_list:
        formData.assignees_list?.length !== 0
          ? formData.assignees_list
          : prePopulatedData?.assignees && prePopulatedData?.assignees.toString() !== "none"
          ? [prePopulatedData.assignees as any]
          : [],
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
    <div className="bg-custom-background-100">
      <Transition
        show={isOpen}
        enter="transition ease-in-out duration-200 transform"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in-out duration-200 transform"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <form
          ref={ref}
          onSubmit={handleSubmit(onSubmitHandler)}
          className="flex border-[0.5px] border-t-0 border-custom-border-100 px-4 items-center gap-x-5 bg-custom-background-100 shadow-custom-shadow-sm z-10"
        >
          <Inputs register={register} setFocus={setFocus} projectDetails={projectDetails} />
        </form>
      </Transition>

      {isOpen && (
        <p className="text-xs ml-3 mt-3 italic text-custom-text-200">
          Press {"'"}Enter{"'"} to add another issue
        </p>
      )}

      {!isOpen && (
        <button
          type="button"
          className="flex items-center gap-x-[6px] text-custom-primary-100 px-3 py-1 rounded-md"
          onClick={() => setIsOpen(true)}
        >
          <PlusIcon className="h-3 w-3" />
          <span className="text-sm font-medium text-custom-primary-100">New Issue</span>
        </button>
      )}
    </div>
  );
});
