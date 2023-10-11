import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { Transition } from "@headlessui/react";
// store
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";

// hooks
import useToast from "hooks/use-toast";
import useKeypress from "hooks/use-keypress";
import useProjectDetails from "hooks/use-project-details";
import useOutsideClickDetector from "hooks/use-outside-click-detector";

// types
import { IIssue } from "types";

type Props = {
  onSuccess?: (data: IIssue) => Promise<void> | void;
  prePopulatedData?: Partial<IIssue>;
};

const defaultValues: Partial<IIssue> = {
  name: "",
};

export const BoardInlineCreateIssueForm: React.FC<Props> = observer((props) => {
  const { prePopulatedData } = props;

  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // store
  const { issueDetail: issueDetailStore, user: userDetailStore } = useMobxStore();

  // ref
  const ref = useRef<HTMLFormElement>(null);

  // states
  const [isOpen, setIsOpen] = useState(false);

  const { setToastAlert } = useToast();

  const { projectDetails } = useProjectDetails();

  const {
    reset,
    handleSubmit,
    getValues,
    register,
    formState: { errors, isSubmitting },
  } = useForm<IIssue>({ defaultValues });

  const handleClose = () => {
    setIsOpen(false);
  };

  useKeypress("Escape", handleClose);
  useOutsideClickDetector(ref, handleClose);

  useEffect(() => {
    const values = getValues();

    if (prePopulatedData) reset({ ...defaultValues, ...values, ...prePopulatedData });
  }, [reset, prePopulatedData, getValues]);

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

    try {
      await issueDetailStore.createIssue(
        workspaceSlug.toString(),
        projectId.toString(),
        formData,
        userDetailStore.currentUser! as any
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
          className="flex flex-col border-[0.5px] border-custom-border-100 justify-between gap-1.5 group/card relative select-none px-3.5 py-3 h-[118px] mb-3 rounded bg-custom-background-100 shadow-custom-shadow-sm"
        >
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
        </form>
      </Transition>

      {isOpen && (
        <p className="text-xs ml-3 italic text-custom-text-200">
          Press {"'"}Enter{"'"} to add another issue
        </p>
      )}

      {!isOpen && (
        <button type="button" onClick={() => setIsOpen(true)}>
          Add Issue
        </button>
      )}
    </div>
  );
});
