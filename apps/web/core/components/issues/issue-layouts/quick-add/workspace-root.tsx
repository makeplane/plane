import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { PlusIcon } from "@plane/propel/icons";
import { setPromiseToast } from "@plane/propel/toast";
import type { TIssue, EIssueLayoutTypes } from "@plane/types";
import { cn, createIssuePayload } from "@plane/utils";
// components
import { ProjectDropdown } from "@/components/dropdowns/project/dropdown";
// plane web imports
import { QuickAddIssueFormRoot } from "@/plane-web/components/issues/quick-add";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
// local imports
import { CreateIssueToastActionItems } from "../../create-issue-toast-action-items";
import { findStateByGroup } from "../utils";

export type TWorkspaceQuickAddIssueButton = {
  isEpic?: boolean;
  onClick: () => void;
};

type TWorkspaceQuickAddIssueRoot = {
  isQuickAddOpen?: boolean;
  layout: EIssueLayoutTypes;
  prePopulatedData?: Partial<TIssue>;
  QuickAddButton?: FC<TWorkspaceQuickAddIssueButton>;
  customQuickAddButton?: React.ReactNode;
  containerClassName?: string;
  setIsQuickAddOpen?: (isOpen: boolean) => void;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  isEpic?: boolean;
};

const defaultValues: Partial<TIssue> = {
  name: "",
};

export const WorkspaceQuickAddIssueRoot = observer(function WorkspaceQuickAddIssueRoot(
  props: TWorkspaceQuickAddIssueRoot
) {
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
  const { workspaceSlug } = useParams();
  // store hooks
  const { joinedProjectIds } = useProject();
  const { getProjectStates } = useProjectState();
  // states
  const [isOpen, setIsOpen] = useState(isQuickAddOpen ?? false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Map state_detail.group from prePopulatedData to an actual state_id for the selected project
  const resolvedPrePopulatedData = useMemo(() => {
    if (!selectedProjectId || !prePopulatedData) return prePopulatedData;

    // Check if prePopulatedData has state_detail.group that needs to be resolved
    const stateGroup = (prePopulatedData as Record<string, unknown>)["state_detail.group"] as string | undefined;
    if (!stateGroup) return prePopulatedData;

    // Find a state in the selected project that belongs to this state group
    const projectStates = getProjectStates(selectedProjectId);
    const targetState = findStateByGroup(projectStates, stateGroup);

    if (targetState) {
      // Return prePopulatedData with state_id set and state_detail.group removed
      const { "state_detail.group": _removed, ...rest } = prePopulatedData as Record<string, unknown>;
      return { ...rest, state_id: targetState.id } as Partial<TIssue>;
    }

    return prePopulatedData;
  }, [selectedProjectId, prePopulatedData, getProjectStates]);
  // form info
  const {
    reset,
    handleSubmit,
    setFocus,
    register,
    formState: { errors, isSubmitting },
  } = useForm<TIssue>({ defaultValues });

  // Set default project when opening
  useEffect(() => {
    if (isOpen && !selectedProjectId && joinedProjectIds && joinedProjectIds.length > 0) {
      setSelectedProjectId(joinedProjectIds[0]);
    }
  }, [isOpen, selectedProjectId, joinedProjectIds]);

  useEffect(() => {
    if (isQuickAddOpen !== undefined) {
      setIsOpen(isQuickAddOpen);
    }
  }, [isQuickAddOpen]);

  useEffect(() => {
    if (!isOpen) {
      reset({ ...defaultValues });
      setSelectedProjectId(null);
    }
  }, [isOpen, reset]);

  const handleIsOpen = (isOpen: boolean) => {
    if (isQuickAddOpen !== undefined && setIsQuickAddOpen) {
      setIsQuickAddOpen(isOpen);
    } else {
      setIsOpen(isOpen);
    }
  };

  const onSubmitHandler = async (formData: TIssue) => {
    if (isSubmitting || !workspaceSlug || !selectedProjectId) return;

    reset({ ...defaultValues });

    const payload = createIssuePayload(selectedProjectId, {
      ...(resolvedPrePopulatedData ?? {}),
      ...formData,
    });

    if (quickAddCallback) {
      const quickAddPromise = quickAddCallback(selectedProjectId, { ...payload });
      setPromiseToast<TIssue>(quickAddPromise, {
        loading: isEpic ? t("epic.adding") : t("issue.adding"),
        success: {
          title: t("common.success"),
          message: () => `${isEpic ? t("epic.create.success") : t("issue.create.success")}`,
          actionItems: (data: TIssue) => (
            <CreateIssueToastActionItems
              workspaceSlug={workspaceSlug.toString()}
              projectId={selectedProjectId}
              issueId={data.id}
              isEpic={isEpic}
            />
          ),
        },
        error: {
          title: t("common.error.label"),
          message: (err: { message?: string }) => err?.message || t("common.error.message"),
        },
      });

      await quickAddPromise;
    }
  };

  return (
    <div
      className={cn(
        containerClassName,
        errors && errors?.name && errors?.name?.message ? `border-danger-strong bg-danger-subtle` : ``
      )}
    >
      {isOpen ? (
        <div className="flex flex-col gap-2">
          {/* Project selector */}
          <div className="flex items-center gap-2 px-2">
            <span className="text-12 text-secondary whitespace-nowrap">Project:</span>
            <ProjectDropdown
              value={selectedProjectId}
              onChange={(projectId) => setSelectedProjectId(projectId)}
              multiple={false}
              buttonVariant="border-with-text"
              buttonClassName="text-13"
              placeholder="Select project"
            />
          </div>
          {/* Quick add form */}
          {selectedProjectId && (
            <QuickAddIssueFormRoot
              isOpen={isOpen}
              layout={layout}
              prePopulatedData={resolvedPrePopulatedData}
              projectId={selectedProjectId}
              hasError={errors && errors?.name && errors?.name?.message ? true : false}
              setFocus={setFocus}
              register={register}
              onSubmit={() => void handleSubmit(onSubmitHandler)()}
              onClose={() => handleIsOpen(false)}
              isEpic={isEpic}
            />
          )}
        </div>
      ) : (
        <>
          {QuickAddButton && <QuickAddButton isEpic={isEpic} onClick={() => handleIsOpen(true)} />}
          {customQuickAddButton && <>{customQuickAddButton}</>}
          {!QuickAddButton && !customQuickAddButton && (
            <button
              className="flex w-full cursor-pointer items-center gap-2 px-2 py-3 bg-layer-transparent hover:bg-layer-transparent-hover"
              onClick={() => handleIsOpen(true)}
            >
              <PlusIcon className="h-3.5 w-3.5 stroke-2" />
              <span className="text-13 font-medium">{t(`${isEpic ? "epic.new" : "issue.new"}`)}</span>
            </button>
          )}
        </>
      )}
    </div>
  );
});
