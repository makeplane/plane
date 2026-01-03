import { useEffect, useRef, useState } from "react";
import { xor } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// Plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TBaseIssue, TIssue } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useModule } from "@/hooks/store/use-module";
import { useProject } from "@/hooks/store/use-project";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// services
import { FileService } from "@/services/file.service";
const fileService = new FileService();
// local imports
import { CreateIssueToastActionItems } from "../create-issue-toast-action-items";
import { DraftIssueLayout } from "./draft-issue-layout";
import { IssueFormRoot } from "./form";
import type { IssueFormProps } from "./form";
import type { IssuesModalProps } from "./modal";

export const CreateUpdateIssueModalBase = observer(function CreateUpdateIssueModalBase(props: IssuesModalProps) {
  const {
    data,
    isOpen,
    onClose,
    beforeFormSubmit,
    onSubmit,
    withDraftIssueWrapper = true,
    storeType: issueStoreFromProps,
    isDraft = false,
    fetchIssueDetails = true,
    moveToIssue = false,
    modalTitle,
    primaryButtonText,
    isProjectSelectionDisabled = false,
    showActionItemsOnUpdate = false,
  } = props;
  const issueStoreType = useIssueStoreType();

  let storeType = issueStoreFromProps ?? issueStoreType;
  // Fallback to project store if epic store is used in issue modal.
  if (storeType === EIssuesStoreType.EPIC) {
    storeType = EIssuesStoreType.PROJECT;
  }
  // ref
  const issueTitleRef = useRef<HTMLInputElement>(null);
  // states
  const [changesMade, setChangesMade] = useState<Partial<TIssue> | null>(null);
  const [createMore, setCreateMore] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([]);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  // store hooks
  const { t } = useTranslation();
  const { workspaceSlug, projectId: routerProjectId, cycleId, moduleId, workItem } = useParams();
  const { fetchCycleDetails } = useCycle();
  const { fetchModuleDetails } = useModule();
  const { issues } = useIssues(storeType);
  const { issues: projectIssues } = useIssues(EIssuesStoreType.PROJECT);
  const { issues: draftIssues } = useIssues(EIssuesStoreType.WORKSPACE_DRAFT);
  const { fetchIssue } = useIssueDetail();
  const { allowedProjectIds, handleCreateUpdatePropertyValues, handleCreateSubWorkItem } = useIssueModal();
  const { getProjectByIdentifier } = useProject();
  // current store details
  const { createIssue, updateIssue } = useIssuesActions(storeType);
  // derived values
  const routerProjectIdentifier = workItem?.toString().split("-")[0];
  const projectIdFromRouter = getProjectByIdentifier(routerProjectIdentifier)?.id;
  const projectId = data?.project_id ?? routerProjectId?.toString() ?? projectIdFromRouter;

  const fetchIssueDetail = async (issueId: string | undefined) => {
    setDescription(undefined);
    if (!workspaceSlug) return;

    if (!projectId || issueId === undefined || !fetchIssueDetails) {
      // Set description to the issue description from the props if available
      setDescription(data?.description_html || "<p></p>");
      return;
    }
    const response = await fetchIssue(workspaceSlug.toString(), projectId.toString(), issueId);
    if (response) setDescription(response?.description_html || "<p></p>");
  };

  useEffect(() => {
    // fetching issue details
    if (isOpen) fetchIssueDetail(data?.id ?? data?.sourceIssueId);

    // if modal is closed, reset active project to null
    // and return to avoid activeProjectId being set to some other project
    if (!isOpen) {
      setActiveProjectId(null);
      return;
    }

    // if data is present, set active project to the project of the
    // issue. This has more priority than the project in the url.
    if (data && data.project_id) {
      setActiveProjectId(data.project_id);
      return;
    }

    // if data is not present, set active project to the first project in the allowedProjectIds array
    if (allowedProjectIds && allowedProjectIds.length > 0 && !activeProjectId)
      setActiveProjectId(projectId?.toString() ?? allowedProjectIds?.[0]);

    // clearing up the description state when we leave the component
    return () => setDescription(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.project_id, data?.id, data?.sourceIssueId, projectId, isOpen, activeProjectId]);

  const addIssueToCycle = async (issue: TIssue, cycleId: string) => {
    if (!workspaceSlug || !issue.project_id) return;

    await issues.addIssueToCycle(workspaceSlug.toString(), issue.project_id, cycleId, [issue.id]);
    fetchCycleDetails(workspaceSlug.toString(), issue.project_id, cycleId);
  };

  const addIssueToModule = async (issue: TIssue, moduleIds: string[]) => {
    if (!workspaceSlug || !issue.project_id) return;

    await Promise.all([
      issues.changeModulesInIssue(workspaceSlug.toString(), issue.project_id, issue.id, moduleIds, []),
      ...moduleIds.map(
        (moduleId) => issue.project_id && fetchModuleDetails(workspaceSlug.toString(), issue.project_id, moduleId)
      ),
    ]);
  };

  const handleCreateMoreToggleChange = (value: boolean) => {
    setCreateMore(value);
  };

  const handleClose = (saveAsDraft?: boolean) => {
    if (changesMade && saveAsDraft && !data) {
      handleCreateIssue(changesMade, true);
    }

    setActiveProjectId(null);
    setChangesMade(null);
    onClose();
    handleDuplicateIssueModal(false);
  };

  const handleCreateIssue = async (
    payload: Partial<TIssue>,
    is_draft_issue: boolean = false
  ): Promise<TIssue | undefined> => {
    if (!workspaceSlug || !payload.project_id) return;

    try {
      let response: TIssue | undefined;
      // if draft issue, use draft issue store to create issue
      if (is_draft_issue) {
        response = (await draftIssues.createIssue(workspaceSlug.toString(), payload)) as TIssue;
      }
      // if cycle id in payload does not match the cycleId in url
      // or if the moduleIds in Payload does not match the moduleId in url
      // use the project issue store to create issues
      else if (
        (payload.cycle_id !== cycleId && storeType === EIssuesStoreType.CYCLE) ||
        (!payload.module_ids?.includes(moduleId?.toString()) && storeType === EIssuesStoreType.MODULE)
      ) {
        response = await projectIssues.createIssue(workspaceSlug.toString(), payload.project_id, payload);
      } // else just use the existing store type's create method
      else if (createIssue) {
        response = await createIssue(payload.project_id, payload);
      }

      // update uploaded assets' status
      if (uploadedAssetIds.length > 0) {
        await fileService.updateBulkProjectAssetsUploadStatus(
          workspaceSlug?.toString() ?? "",
          response?.project_id ?? "",
          response?.id ?? "",
          {
            asset_ids: uploadedAssetIds,
          }
        );
        setUploadedAssetIds([]);
      }

      if (!response) throw new Error();

      // check if we should add issue to cycle/module
      if (!is_draft_issue) {
        if (
          payload.cycle_id &&
          payload.cycle_id !== "" &&
          (payload.cycle_id !== cycleId || storeType !== EIssuesStoreType.CYCLE)
        ) {
          await addIssueToCycle(response, payload.cycle_id);
        }
        if (
          payload.module_ids &&
          payload.module_ids.length > 0 &&
          (!payload.module_ids.includes(moduleId?.toString()) || storeType !== EIssuesStoreType.MODULE)
        ) {
          await addIssueToModule(response, payload.module_ids);
        }
      }

      // add other property values
      if (response.id && response.project_id) {
        await handleCreateUpdatePropertyValues({
          issueId: response.id,
          issueTypeId: response.type_id,
          projectId: response.project_id,
          workspaceSlug: workspaceSlug?.toString(),
          isDraft: is_draft_issue,
        });

        // create sub work item
        await handleCreateSubWorkItem({
          workspaceSlug: workspaceSlug?.toString(),
          projectId: response.project_id,
          parentId: response.id,
        });
      }

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: `${is_draft_issue ? t("draft_created") : t("issue_created_successfully")} `,
        actionItems: !is_draft_issue && response?.project_id && (
          <CreateIssueToastActionItems
            workspaceSlug={workspaceSlug.toString()}
            projectId={response?.project_id}
            issueId={response.id}
          />
        ),
      });
      if (!createMore) handleClose();
      if (createMore && issueTitleRef) issueTitleRef?.current?.focus();
      setDescription("<p></p>");
      setChangesMade(null);
      return response;
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: error?.error ?? t(is_draft_issue ? "draft_creation_failed" : "issue_creation_failed"),
      });
      throw error;
    }
  };

  const handleUpdateIssue = async (payload: Partial<TIssue>): Promise<TIssue | undefined> => {
    if (!workspaceSlug || !payload.project_id || !data?.id) return;

    try {
      if (isDraft) await draftIssues.updateIssue(workspaceSlug.toString(), data.id, payload);
      else if (updateIssue) await updateIssue(payload.project_id, data.id, payload);

      // check if we should add/remove issue to/from cycle
      if (
        payload.cycle_id &&
        payload.cycle_id !== "" &&
        (payload.cycle_id !== cycleId || storeType !== EIssuesStoreType.CYCLE)
      ) {
        await addIssueToCycle(data as TBaseIssue, payload.cycle_id);
      }
      if (data.cycle_id && !payload.cycle_id && data.project_id) {
        await issues.removeIssueFromCycle(workspaceSlug.toString(), data.project_id, data.cycle_id, data.id);
        fetchCycleDetails(workspaceSlug.toString(), data.project_id, data.cycle_id);
      }

      if (data.module_ids && payload.module_ids && data.project_id) {
        const updatedModuleIds = xor(data.module_ids, payload.module_ids);
        const modulesToAdd: string[] = [];
        const modulesToRemove: string[] = [];

        for (const moduleId of updatedModuleIds) {
          if (data.module_ids.includes(moduleId)) {
            modulesToRemove.push(moduleId);
          } else {
            modulesToAdd.push(moduleId);
          }
        }
        await issues.changeModulesInIssue(
          workspaceSlug.toString(),
          data.project_id,
          data.id,
          modulesToAdd,
          modulesToRemove
        );
      }

      // add other property values
      await handleCreateUpdatePropertyValues({
        issueId: data.id,
        issueTypeId: payload.type_id,
        projectId: payload.project_id,
        workspaceSlug: workspaceSlug?.toString(),
        isDraft: isDraft,
      });

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("issue_updated_successfully"),
        actionItems:
          showActionItemsOnUpdate && payload.project_id ? (
            <CreateIssueToastActionItems
              workspaceSlug={workspaceSlug.toString()}
              projectId={payload.project_id}
              issueId={data.id}
            />
          ) : undefined,
      });
      handleClose();
    } catch (error: any) {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: error?.error ?? t("issue_could_not_be_updated"),
      });
    }
  };

  const handleFormSubmit = async (payload: Partial<TIssue>, is_draft_issue: boolean = false) => {
    if (!workspaceSlug || !payload.project_id || !storeType) return;
    // remove sourceIssueId from payload since it is not needed
    if (data?.sourceIssueId) delete data.sourceIssueId;

    let response: TIssue | undefined = undefined;

    try {
      if (beforeFormSubmit) await beforeFormSubmit();
      if (!data?.id) response = await handleCreateIssue(payload, is_draft_issue);
      else response = await handleUpdateIssue(payload);
    } finally {
      if (response != undefined && onSubmit) await onSubmit(response);
    }
  };

  const handleFormChange = (formData: Partial<TIssue> | null) => setChangesMade(formData);

  const handleUpdateUploadedAssetIds = (assetId: string) => setUploadedAssetIds((prev) => [...prev, assetId]);

  const handleDuplicateIssueModal = (value: boolean) => setIsDuplicateModalOpen(value);

  // don't open the modal if there are no projects
  if (!allowedProjectIds || allowedProjectIds.length === 0 || !activeProjectId) return null;

  const commonIssueModalProps: IssueFormProps = {
    issueTitleRef: issueTitleRef,
    data: {
      ...data,
      description_html: description,
      cycle_id: data?.cycle_id ? data?.cycle_id : cycleId ? cycleId.toString() : null,
      module_ids: data?.module_ids ? data?.module_ids : moduleId ? [moduleId.toString()] : null,
    },
    onAssetUpload: handleUpdateUploadedAssetIds,
    onClose: handleClose,
    onSubmit: (payload) => handleFormSubmit(payload, isDraft),
    projectId: activeProjectId,
    isCreateMoreToggleEnabled: createMore,
    onCreateMoreToggleChange: handleCreateMoreToggleChange,
    isDraft: isDraft,
    moveToIssue: moveToIssue,
    modalTitle: modalTitle,
    primaryButtonText: primaryButtonText,
    isDuplicateModalOpen: isDuplicateModalOpen,
    handleDuplicateIssueModal: handleDuplicateIssueModal,
    isProjectSelectionDisabled: isProjectSelectionDisabled,
  };

  return (
    <ModalCore
      isOpen={isOpen}
      position={EModalPosition.TOP}
      width={isDuplicateModalOpen ? EModalWidth.VIXL : EModalWidth.XXXXL}
      className="!bg-transparent rounded-lg shadow-none transition-[width] ease-linear"
    >
      {withDraftIssueWrapper ? (
        <DraftIssueLayout {...commonIssueModalProps} changesMade={changesMade} onChange={handleFormChange} />
      ) : (
        <IssueFormRoot {...commonIssueModalProps} />
      )}
    </ModalCore>
  );
});
