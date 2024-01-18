import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
import { PlusIcon } from "lucide-react";
// hooks
import { useProject, useWorkspace } from "hooks/store";
import useToast from "hooks/use-toast";
import useKeypress from "hooks/use-keypress";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// helpers
import { createIssuePayload } from "helpers/issue.helper";
// types
import { TIssue } from "@plane/types";

type Props = {
  formKey: keyof TIssue;
  groupId?: string;
  subGroupId?: string | null;
  prePopulatedData?: Partial<TIssue>;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  viewId?: string;
};

const defaultValues: Partial<TIssue> = {
  name: "",
};

const Inputs = (props: any) => {
  const { register, setFocus, projectDetails } = props;

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  return (
    <>
      <h4 className="w-20 text-xs leading-5 text-custom-text-400">{projectDetails?.identifier ?? "..."}</h4>
      <input
        type="text"
        autoComplete="off"
        placeholder="Issue Title"
        {...register("name", {
          required: "Issue title is required.",
        })}
        className="w-full rounded-md bg-transparent py-3 text-sm leading-5 text-custom-text-200 outline-none"
      />
    </>
  );
};

export const SpreadsheetQuickAddIssueForm: React.FC<Props> = observer((props) => {
  const { formKey, prePopulatedData, quickAddCallback, viewId } = props;
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { currentProjectDetails } = useProject();
  // form info
  const {
    reset,
    handleSubmit,
    setFocus,
    register,
    formState: { errors, isSubmitting },
  } = useForm<TIssue>({ defaultValues });

  // ref
  const ref = useRef<HTMLFormElement>(null);

  // states
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => setIsOpen(false);

  // hooks
  useKeypress("Escape", handleClose);
  useOutsideClickDetector(ref, handleClose);
  const { setToastAlert } = useToast();

  useEffect(() => {
    setFocus("name");
  }, [setFocus, isOpen]);

  useEffect(() => {
    if (!isOpen) reset({ ...defaultValues });
  }, [isOpen, reset]);

  useEffect(() => {
    if (!errors) return;

    Object.keys(errors).forEach((key) => {
      const error = errors[key as keyof TIssue];

      setToastAlert({
        type: "error",
        title: "Error!",
        message: error?.message?.toString() || "Some error occurred. Please try again.",
      });
    });
  }, [errors, setToastAlert]);

  // const onSubmitHandler = async (formData: TIssue) => {
  //   if (isSubmitting || !workspaceSlug || !projectId) return;

  //   // resetting the form so that user can add another issue quickly
  //   reset({ ...defaultValues });

  //   const payload = createIssuePayload(workspaceDetail!, projectDetails!, {
  //     ...(prePopulatedData ?? {}),
  //     ...formData,
  //   });

  //   try {
  //     quickAddStore.createIssue(
  //       workspaceSlug.toString(),
  //       projectId.toString(),
  //       {
  //         group_id: groupId ?? null,
  //         sub_group_id: null,
  //       },
  //       payload
  //     );

  //     setToastAlert({
  //       type: "success",
  //       title: "Success!",
  //       message: "Issue created successfully.",
  //     });
  //   } catch (err: any) {
  //     Object.keys(err || {}).forEach((key) => {
  //       const error = err?.[key];
  //       const errorTitle = error ? (Array.isArray(error) ? error.join(", ") : error) : null;

  //       setToastAlert({
  //         type: "error",
  //         title: "Error!",
  //         message: errorTitle || "Some error occurred. Please try again.",
  //       });
  //     });
  //   }
  // };

  const onSubmitHandler = async (formData: TIssue) => {
    if (isSubmitting || !currentWorkspace || !currentProjectDetails) return;

    reset({ ...defaultValues });

    const payload = createIssuePayload(currentProjectDetails.id, {
      ...(prePopulatedData ?? {}),
      ...formData,
    });

    try {
      quickAddCallback &&
        (await quickAddCallback(currentWorkspace.slug, currentProjectDetails.id, { ...payload } as TIssue, viewId));
      setToastAlert({
        type: "success",
        title: "Success!",
        message: "Issue created successfully.",
      });
    } catch (err: any) {
      console.error(err);
      setToastAlert({
        type: "error",
        title: "Error!",
        message: err?.message || "Some error occurred. Please try again.",
      });
    }
  };

  return (
    <div>
      {isOpen && (
        <div>
          <form
            ref={ref}
            onSubmit={handleSubmit(onSubmitHandler)}
            className="z-10 flex items-center gap-x-5 border-[0.5px] border-t-0 border-custom-border-100 bg-custom-background-100 px-4 shadow-custom-shadow-sm"
          >
            <Inputs
              formKey={formKey}
              register={register}
              setFocus={setFocus}
              projectDetails={currentProjectDetails ?? null}
            />
          </form>
        </div>
      )}

      {isOpen && (
        <p className="ml-3 mt-3 text-xs italic text-custom-text-200">
          Press {"'"}Enter{"'"} to add another issue
        </p>
      )}

      {!isOpen && (
        <div className="flex items-center">
          <button
            type="button"
            className="flex items-center gap-x-[6px] rounded-md px-2 pt-3 text-custom-primary-100"
            onClick={() => setIsOpen(true)}
          >
            <PlusIcon className="h-3.5 w-3.5 stroke-2" />
            <span className="text-sm font-medium text-custom-primary-100">New Issue</span>
          </button>
        </div>
      )}
    </div>
  );
});
