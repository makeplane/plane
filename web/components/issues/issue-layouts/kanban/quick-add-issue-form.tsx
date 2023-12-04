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
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// helpers
import { createIssuePayload } from "helpers/issue.helper";
// types
import { IIssue, IProject } from "types";

const Inputs = (props: any) => {
  const { register, setFocus, projectDetail } = props;

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  return (
    <div>
      <h4 className="text-xs font-medium leading-5 text-custom-text-300">{projectDetail?.identifier ?? "..."}</h4>
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

interface IKanBanQuickAddIssueForm {
  formKey: keyof IIssue;
  groupId?: string;
  subGroupId?: string | null;
  prePopulatedData?: Partial<IIssue>;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: IIssue,
    viewId?: string
  ) => Promise<IIssue | undefined>;
  viewId?: string;
}

const defaultValues: Partial<IIssue> = {
  name: "",
};

export const KanBanQuickAddIssueForm: React.FC<IKanBanQuickAddIssueForm> = observer((props) => {
  const { formKey, groupId, prePopulatedData, quickAddCallback, viewId } = props;

  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  const { workspace: workspaceStore, project: projectStore } = useMobxStore();

  const workspaceDetail = (workspaceSlug && workspaceStore.getWorkspaceBySlug(workspaceSlug)) || null;
  const projectDetail: IProject | null =
    (workspaceSlug && projectId && projectStore.getProjectById(workspaceSlug, projectId)) || null;

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
  } = useForm<IIssue>({ defaultValues });

  useEffect(() => {
    if (!isOpen) reset({ ...defaultValues });
  }, [isOpen, reset]);

  const onSubmitHandler = async (formData: IIssue) => {
    if (isSubmitting || !groupId || !workspaceDetail || !projectDetail) return;

    reset({ ...defaultValues });

    const payload = createIssuePayload(workspaceDetail, projectDetail, {
      ...(prePopulatedData ?? {}),
      ...formData,
    });

    try {
      quickAddCallback &&
        (await quickAddCallback(
          workspaceSlug,
          projectId,
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
    <div>
      {isOpen ? (
        <div className="shadow-custom-shadow-sm">
          <form
            ref={ref}
            onSubmit={handleSubmit(onSubmitHandler)}
            className="flex items-center gap-x-3 border-[0.5px] w-full border-t-0 border-custom-border-100 px-3 bg-custom-background-100"
          >
            <Inputs formKey={formKey} register={register} setFocus={setFocus} projectDetail={projectDetail} />
          </form>
          <div className="text-xs italic text-custom-text-200 px-3 py-2">{`Press 'Enter' to add another issue`}</div>
        </div>
      ) : (
        <div
          className="w-full flex items-center text-custom-primary-100 p-3 py-3 cursor-pointer gap-2"
          onClick={() => setIsOpen(true)}
        >
          <PlusIcon className="h-3.5 w-3.5 stroke-2" />
          <span className="text-sm font-medium text-custom-primary-100">New Issue</span>
        </div>
      )}

      {/* {isOpen && (
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
      )} */}
    </div>
  );
});
