import { PlusIcon } from "lucide-react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type { FC } from "react";
import { useEffect, useState } from "react";
import type { UseFormRegister } from "react-hook-form";
import { useForm } from "react-hook-form";
// plane imports
import { WORK_ITEM_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setPromiseToast } from "@plane/propel/toast";
import type { EIssueLayoutTypes, IProject, TIssue } from "@plane/types";
import { cn, createIssuePayload } from "@plane/utils";
// helpers
import { captureError } from "@/helpers/event-tracker.helper";
// plane web imports
import { QuickAddIssueFormRoot } from "@/plane-web/components/issues/quick-add";
// local imports
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { trackWorkItemCreated } from "@/plane-web/helpers/event-tracker-v2.helper";
import { CreateIssueToastActionItems } from "../../create-issue-toast-action-items";

export type TQuickAddIssueForm = {
  ref: React.RefObject<HTMLFormElement>;
  isOpen: boolean;
  projectDetail: IProject;
  hasError: boolean;
  register: UseFormRegister<TIssue>;
  onSubmit: () => void;
  isEpic: boolean;
};

export type TQuickAddIssueButton = {
  isEpic?: boolean;
  onClick: () => void;
};

type TQuickAddIssueRoot = {
  isQuickAddOpen?: boolean;
  layout: EIssueLayoutTypes;
  prePopulatedData?: Partial<TIssue>;
  QuickAddButton?: FC<TQuickAddIssueButton>;
  customQuickAddButton?: React.ReactNode;
  containerClassName?: string;
  setIsQuickAddOpen?: (isOpen: boolean) => void;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  isEpic?: boolean;
};

const defaultValues: Partial<TIssue> = {
  name: "",
};

export const QuickAddIssueRoot = observer(function QuickAddIssueRoot(props: TQuickAddIssueRoot) {
  const {
    isQuickAddOpen,
    layout,
    prePopulatedData,
    QuickAddButton,
    customQuickAddButton,
    containerClassName = "",
    setIsQuickAddOpen,
    quickAddCallback,
    isEpic = false,
  } = props;
  // i18n
  const { t } = useTranslation();
  // router
  const { workspaceSlug, projectId } = useParams();
  // states
  const [isOpen, setIsOpen] = useState(isQuickAddOpen ?? false);

  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { data: currentUser } = useUser();
  const { getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();

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
        loading: isEpic ? t("epic.adding") : t("issue.adding"),
        success: {
          title: t("common.success"),
          message: () => `${isEpic ? t("epic.create.success") : t("issue.create.success")}`,
          actionItems: (data) => (
            // TODO: Translate here
            <CreateIssueToastActionItems
              workspaceSlug={workspaceSlug.toString()}
              projectId={projectId.toString()}
              issueId={data.id}
              isEpic={isEpic}
            />
          ),
        },
        error: {
          title: t("common.error.label"),
          message: (err) => err?.message || t("common.error.message"),
        },
      });

      try {
        const quickAddRes = await quickAddPromise;

        if (currentWorkspace && currentUser && quickAddRes) {
          const role = getWorkspaceRoleByWorkspaceSlug(currentWorkspace.slug);
          trackWorkItemCreated(
            { id: quickAddRes.id, created_at: quickAddRes.created_at ?? "" },
            { id: projectId.toString() },
            currentWorkspace,
            currentUser,
            role
          );
        }
      } catch (error) {
        captureError({
          eventName: WORK_ITEM_TRACKER_EVENTS.create,
          payload: { id: payload.id },
          error: error as Error,
        });
      }
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
          isEpic={isEpic}
        />
      ) : (
        <>
          {QuickAddButton && <QuickAddButton isEpic={isEpic} onClick={() => handleIsOpen(true)} />}
          {customQuickAddButton && <>{customQuickAddButton}</>}
          {!QuickAddButton && !customQuickAddButton && (
            <div
              className="flex w-full cursor-pointer items-center gap-2 px-2 py-3 text-custom-text-350 hover:text-custom-text-300"
              onClick={() => handleIsOpen(true)}
            >
              <PlusIcon className="h-3.5 w-3.5 stroke-2" />
              <span className="text-sm font-medium">{t(`${isEpic ? "epic.new" : "issue.new"}`)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
});
