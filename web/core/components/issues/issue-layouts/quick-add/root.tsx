"use client";

import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { useForm, UseFormRegister } from "react-hook-form";
import { PlusIcon } from "lucide-react";
// types
import { IProject, TIssue } from "@plane/types";
// ui
import { setPromiseToast } from "@plane/ui";
// components
import { CreateIssueToastActionItems } from "@/components/issues";
// constants
import { ISSUE_CREATED } from "@/constants/event-tracker";
import { EIssueLayoutTypes } from "@/constants/issue";
// helpers
import { cn } from "@/helpers/common.helper";
import { createIssuePayload } from "@/helpers/issue.helper";
// hooks
import { useEventTracker } from "@/hooks/store";
// plane web components
import { QuickAddIssueFormRoot } from "@/plane-web/components/issues";

export type TQuickAddIssueForm = {
  ref: React.RefObject<HTMLFormElement>;
  isOpen: boolean;
  projectDetail: IProject;
  hasError: boolean;
  register: UseFormRegister<TIssue>;
  onSubmit: () => void;
};

export type TQuickAddIssueButton = {
  onClick: () => void;
};

type TQuickAddIssueRoot = {
  isQuickAddOpen?: boolean;
  layout: EIssueLayoutTypes;
  prePopulatedData?: Partial<TIssue>;
  QuickAddButton?: FC<TQuickAddIssueButton>;
  customQuickAddButton?: JSX.Element;
  containerClassName?: string;
  setIsQuickAddOpen?: (isOpen: boolean) => void;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
};

const defaultValues: Partial<TIssue> = {
  name: "",
};

export const QuickAddIssueRoot: FC<TQuickAddIssueRoot> = observer((props) => {
  const {
    isQuickAddOpen,
    layout,
    prePopulatedData,
    QuickAddButton,
    customQuickAddButton,
    containerClassName = "",
    setIsQuickAddOpen,
    quickAddCallback,
  } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  const pathname = usePathname();
  // states
  const [isOpen, setIsOpen] = useState(isQuickAddOpen ?? false);
  // store hooks
  const { captureIssueEvent } = useEventTracker();
  // form info
  const {
    reset,
    handleSubmit,
    setFocus,
    register,
    formState: { errors, isSubmitting },
  } = useForm<TIssue>({ defaultValues });

  useEffect(() => {
    if (isQuickAddOpen !== undefined) {
      setIsOpen(isQuickAddOpen);
    }
  }, [isQuickAddOpen]);

  useEffect(() => {
    if (!isOpen) reset({ ...defaultValues });
  }, [isOpen, reset]);

  const handleIsOpen = (isOpen: boolean) => {
    if (isQuickAddOpen !== undefined && setIsQuickAddOpen) {
      setIsQuickAddOpen(isOpen);
    } else {
      setIsOpen(isOpen);
    }
  };

  const onSubmitHandler = async (formData: TIssue) => {
    if (isSubmitting || !workspaceSlug || !projectId) return;

    reset({ ...defaultValues });

    const payload = createIssuePayload(projectId.toString(), {
      ...(prePopulatedData ?? {}),
      ...formData,
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
            payload: { ...res, state: "SUCCESS", element: ` ${layout} quick add` },
            path: pathname,
          });
        })
        .catch(() => {
          captureIssueEvent({
            eventName: ISSUE_CREATED,
            payload: { ...payload, state: "FAILED", element: `${layout}  quick ad` },
            path: pathname,
          });
        });
    }
  };

  if (!projectId) return null;

  return (
    <div
      className={cn(
        containerClassName,
        errors && errors?.name && errors?.name?.message ? `border-red-500 bg-red-500/10` : ``
      )}
    >
      {isOpen ? (
        <QuickAddIssueFormRoot
          isOpen={isOpen}
          layout={layout}
          prePopulatedData={prePopulatedData}
          projectId={projectId?.toString()}
          hasError={errors && errors?.name && errors?.name?.message ? true : false}
          setFocus={setFocus}
          register={register}
          onSubmit={handleSubmit(onSubmitHandler)}
          onClose={() => handleIsOpen(false)}
        />
      ) : (
        <>
          {QuickAddButton && <QuickAddButton onClick={() => handleIsOpen(true)} />}
          {customQuickAddButton && <>{customQuickAddButton}</>}
          {!QuickAddButton && !customQuickAddButton && (
            <div
              className="flex w-full cursor-pointer items-center gap-2 px-2 py-3 text-custom-text-350 hover:text-custom-text-300"
              onClick={() => handleIsOpen(true)}
            >
              <PlusIcon className="h-3.5 w-3.5 stroke-2" />
              <span className="text-sm font-medium">New Issue</span>
            </div>
          )}
        </>
      )}
    </div>
  );
});
