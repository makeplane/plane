"use client";

import { useEffect, useState, useRef, FC } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { PlusIcon } from "lucide-react";
import { IProject, TIssue } from "@plane/types";
// hooks
import { setPromiseToast } from "@plane/ui";
import { CreateIssueToastActionItems } from "@/components/issues";
import { ISSUE_CREATED } from "@/constants/event-tracker";
import { cn } from "@/helpers/common.helper";
import { renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { createIssuePayload } from "@/helpers/issue.helper";
import { useEventTracker, useProject } from "@/hooks/store";
import useKeypress from "@/hooks/use-keypress";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";
// helpers
// ui
// types
// constants

interface IInputProps {
  formKey: string;
  register: any;
  setFocus: any;
  projectDetail: IProject | null;
}
const Inputs: FC<IInputProps> = (props) => {
  const { formKey, register, setFocus, projectDetail } = props;

  useEffect(() => {
    setFocus(formKey);
  }, [formKey, setFocus]);

  return (
    <div className="flex w-full items-center gap-3">
      <div className="text-xs font-medium text-custom-text-400">{projectDetail?.identifier ?? "..."}</div>
      <input
        type="text"
        autoComplete="off"
        placeholder="Issue Title"
        {...register(formKey, {
          required: "Issue title is required.",
        })}
        className="w-full rounded-md bg-transparent px-2 py-3 text-sm font-medium leading-5 text-custom-text-200 outline-none"
      />
    </div>
  );
};

type IGanttQuickAddIssueForm = {
  prePopulatedData?: Partial<TIssue>;
  onSuccess?: (data: TIssue) => Promise<void> | void;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
};

const defaultValues: Partial<TIssue> = {
  name: "",
};

export const GanttQuickAddIssueForm: React.FC<IGanttQuickAddIssueForm> = observer((props) => {
  const { prePopulatedData, quickAddCallback } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  const pathname = usePathname();
  // hooks
  const { getProjectById } = useProject();
  const { captureIssueEvent } = useEventTracker();

  const projectDetail = (projectId && getProjectById(projectId.toString())) || undefined;

  const ref = useRef<HTMLFormElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const handleClose = () => setIsOpen(false);

  useKeypress("Escape", handleClose);
  useOutsideClickDetector(ref, handleClose);

  // form info
  const {
    reset,
    handleSubmit,
    setFocus,
    register,
    formState: { errors, isSubmitting },
  } = useForm<TIssue>({ defaultValues });

  useEffect(() => {
    if (!isOpen) reset({ ...defaultValues });
  }, [isOpen, reset]);

  const onSubmitHandler = async (formData: TIssue) => {
    if (isSubmitting || !workspaceSlug || !projectId) return;

    reset({ ...defaultValues });

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1);

    const payload = createIssuePayload(projectId.toString(), {
      ...(prePopulatedData ?? {}),
      ...formData,
      start_date: renderFormattedPayloadDate(new Date()),
      target_date: renderFormattedPayloadDate(targetDate),
    });

    if (quickAddCallback) {
      const quickAddPromise = quickAddCallback(projectId.toString(), { ...payload });
      setPromiseToast<any>(quickAddPromise, {
        loading: "Adding issue...",
        success: {
          title: "Success!",
          message: () => "Issue created successfully.",
          actionItems: (data) => (
            <CreateIssueToastActionItems
              workspaceSlug={workspaceSlug.toString()}
              projectId={projectId.toString()}
              issueId={data.id}
            />
          ),
        },
        error: {
          title: "Error!",
          message: (err) => err?.message || "Some error occurred. Please try again.",
        },
      });

      await quickAddPromise
        .then((res) => {
          captureIssueEvent({
            eventName: ISSUE_CREATED,
            payload: { ...res, state: "SUCCESS", element: "Gantt quick add" },
            path: pathname,
          });
        })
        .catch(() => {
          captureIssueEvent({
            eventName: ISSUE_CREATED,
            payload: { ...payload, state: "FAILED", element: "Gantt quick add" },
            path: pathname,
          });
        });
    }
  };
  return (
    <>
      {isOpen ? (
        <div
          className={cn("sticky bottom-0 z-[1] bg-custom-background-100", {
            "border border-red-500/20 bg-red-500/10": errors && errors?.name && errors?.name?.message,
          })}
        >
          <div className="shadow-custom-shadow-sm">
            <form
              ref={ref}
              onSubmit={handleSubmit(onSubmitHandler)}
              className="flex w-full items-center gap-x-3 border-[0.5px] border-custom-border-100 bg-custom-background-100 px-3"
            >
              <Inputs formKey={"name"} register={register} setFocus={setFocus} projectDetail={projectDetail ?? null} />
            </form>
            <div className="px-3 py-2 text-xs italic text-custom-text-200">{`Press 'Enter' to add another issue`}</div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="sticky bottom-0 z-[1] flex w-full cursor-pointer items-center gap-2 border-t-[1px] border-custom-border-200 bg-custom-background-100 px-3 pt-2 text-custom-text-350 hover:text-custom-text-300"
          onClick={() => setIsOpen(true)}
        >
          <PlusIcon className="h-3.5 w-3.5 stroke-2" />
          <span className="text-sm font-medium">New Issue</span>
        </button>
      )}
    </>
  );
});
