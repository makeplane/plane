import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
// store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useToast from "hooks/use-toast";
import useKeypress from "hooks/use-keypress";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// helpers
import { createIssuePayload } from "helpers/issue.helper";
// icons
import { PlusIcon } from "lucide-react";
// types
import { IIssue, IProject } from "types";

type Props = {
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
  onOpen?: () => void;
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
        className="w-full rounded-md bg-transparent py-1.5 pr-2 text-xs font-medium leading-5 text-custom-text-200 outline-none"
      />
    </>
  );
};

export const CalendarQuickAddIssueForm: React.FC<Props> = observer((props) => {
  const { formKey, groupId, prePopulatedData, quickAddCallback, viewId, onOpen } = props;

  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  const { workspace: workspaceStore, project: projectStore } = useMobxStore();

  // ref
  const ref = useRef<HTMLDivElement>(null);

  // states
  const [isOpen, setIsOpen] = useState(false);

  const { setToastAlert } = useToast();

  // derived values
  const workspaceDetail = (workspaceSlug && workspaceStore.getWorkspaceBySlug(workspaceSlug)) || null;
  const projectDetail: IProject | null =
    (workspaceSlug && projectId && projectStore.getProjectById(workspaceSlug, projectId)) || null;

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

  const handleOpen = () => {
    setIsOpen(true);
    if (onOpen) onOpen();
  };

  return (
    <>
      {isOpen && (
        <div
          ref={ref}
          className={`z-20 w-full transition-all ${
            isOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
          }`}
        >
          <form
            onSubmit={handleSubmit(onSubmitHandler)}
            className="z-50 flex w-full items-center gap-x-2 rounded border-[0.5px] border-custom-border-200 bg-custom-background-100 px-2 shadow-custom-shadow-2xs transition-opacity"
          >
            <Inputs formKey={formKey} register={register} setFocus={setFocus} projectDetails={projectDetail} />
          </form>
        </div>
      )}

      {!isOpen && (
        <div className="hidden rounded border-[0.5px] border-custom-border-200 group-hover:block">
          <button
            type="button"
            className="flex w-full items-center gap-x-[6px] rounded-md px-2 py-1.5 text-custom-primary-100"
            onClick={handleOpen}
          >
            <PlusIcon className="h-3.5 w-3.5 stroke-2" />
            <span className="text-sm font-medium text-custom-primary-100">New Issue</span>
          </button>
        </div>
      )}
    </>
  );
});
