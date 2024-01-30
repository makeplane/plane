import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
import { PlusIcon } from "lucide-react";
// hooks
import { useProject } from "hooks/store";
import useToast from "hooks/use-toast";
import useKeypress from "hooks/use-keypress";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// helpers
import { createIssuePayload } from "helpers/issue.helper";
// types
import { TIssue } from "@plane/types";

const Inputs = (props: any) => {
  const { register, setFocus, projectDetail } = props;

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  return (
    <div className="w-full">
      <h4 className="text-xs font-medium leading-5 text-custom-text-300">{projectDetail?.identifier ?? "..."}</h4>
      <input
        autoComplete="off"
        placeholder="Issue Title"
        {...register("name", {
          required: "Issue title is required.",
        })}
        className="w-full rounded-md bg-transparent px-2 py-1.5 pl-0 text-sm font-medium leading-5 text-custom-text-200 outline-none"
      />
    </div>
  );
};

interface IKanBanQuickAddIssueForm {
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
}

const defaultValues: Partial<TIssue> = {
  name: "",
};

export const KanBanQuickAddIssueForm: React.FC<IKanBanQuickAddIssueForm> = observer((props) => {
  const { formKey, prePopulatedData, quickAddCallback, viewId } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { getProjectById } = useProject();

  const projectDetail = projectId ? getProjectById(projectId.toString()) : null;

  const ref = useRef<HTMLFormElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const handleClose = () => setIsOpen(false);

  useKeypress("Escape", handleClose);
  useOutsideClickDetector(ref, handleClose);
  const { setToastAlert } = useToast();

  const {
    reset,
    handleSubmit,
    setFocus,
    register,
    formState: { isSubmitting },
  } = useForm<TIssue>({ defaultValues });

  useEffect(() => {
    if (!isOpen) reset({ ...defaultValues });
  }, [isOpen, reset]);

  const onSubmitHandler = async (formData: TIssue) => {
    if (isSubmitting || !workspaceSlug || !projectId) return;

    reset({ ...defaultValues });

    const payload = createIssuePayload(projectId.toString(), {
      ...(prePopulatedData ?? {}),
      ...formData,
    });

    try {
      quickAddCallback &&
        (await quickAddCallback(
          workspaceSlug.toString(),
          projectId.toString(),
          {
            ...payload,
          },
          viewId
        ));
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
    <>
      {isOpen ? (
        <div className="shadow-custom-shadow-sm m-1.5 rounded overflow-hidden">
          <form
            ref={ref}
            onSubmit={handleSubmit(onSubmitHandler)}
            className="flex w-full items-center gap-x-3 bg-custom-background-100 p-3"
          >
            <Inputs formKey={formKey} register={register} setFocus={setFocus} projectDetail={projectDetail} />
          </form>
          <div className="px-3 py-2 text-xs italic text-custom-text-200">{`Press 'Enter' to add another issue`}</div>
        </div>
      ) : (
        <div
          className="flex w-full cursor-pointer items-center gap-2 p-3 py-3 text-custom-primary-100"
          onClick={() => setIsOpen(true)}
        >
          <PlusIcon className="h-3.5 w-3.5 stroke-2" />
          <span className="text-sm font-medium text-custom-primary-100">New Issue</span>
        </div>
      )}
    </>
  );
});
