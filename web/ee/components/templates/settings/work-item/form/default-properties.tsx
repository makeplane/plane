import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useFormContext } from "react-hook-form";
import { LayoutPanelTop } from "lucide-react";
// plane imports
import { ETemplateLevel, EUserPermissionsLevel, EUserProjectRoles, EUserWorkspaceRoles } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TWorkItemTemplateForm, TWorkItemTemplateFormData } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn, TWorkItemSanitizationResult } from "@plane/utils";
// components
import { StateDropdown, PriorityDropdown, MemberDropdown, ModuleDropdown } from "@/components/dropdowns";
import { ParentIssuesListModal } from "@/components/issues";
import { IssueLabelSelect } from "@/components/issues/select";
import { CreateLabelModal } from "@/components/labels";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { useProject, useUserPermissions } from "@/hooks/store";
// plane web imports
import { IssueIdentifier } from "@/plane-web/components/issues";
// local imports
import { COMMON_BUTTON_CLASS_NAME, COMMON_ERROR_CLASS_NAME, PARENT_BUTTON_CLASS_NAME } from "./common";

type TDefaultWorkItemTemplatePropertiesProps = {
  workspaceSlug: string;
  projectId: string | null;
  currentLevel: ETemplateLevel;
  templateInvalidIds?: TWorkItemSanitizationResult<TWorkItemTemplateFormData>["invalid"];
  handleTemplateInvalidIdsChange: <K extends keyof TWorkItemTemplateFormData>(
    key: K,
    invalidIds: TWorkItemSanitizationResult<TWorkItemTemplateFormData>["invalid"][K]
  ) => void;
};

export const DefaultWorkItemTemplateProperties = observer((props: TDefaultWorkItemTemplatePropertiesProps) => {
  const { workspaceSlug, projectId, currentLevel, templateInvalidIds, handleTemplateInvalidIdsChange } = props;
  // states
  const [isCreateLabelModalOpen, setIsCreateLabelModalOpen] = useState(false);
  const [isParentIssueListModalOpen, setIsParentIssueListModalOpen] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { getProjectById } = useProject();
  // issue modal context
  const { selectedParentIssue, setSelectedParentIssue } = useIssueModal();
  // form context
  const {
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<TWorkItemTemplateForm>();
  // derived values
  const parentId = watch("work_item.parent_id");
  const projectDetails = projectId ? getProjectById(projectId) : undefined;
  const canCreateLabel =
    currentLevel === ETemplateLevel.WORKSPACE
      ? allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE)
      : allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);

  if (!projectId) return null;

  return (
    <>
      <CreateLabelModal
        isOpen={isCreateLabelModalOpen}
        handleClose={() => setIsCreateLabelModalOpen(false)}
        projectId={projectId}
        onSuccess={(response) => {
          setValue<"work_item.label_ids">("work_item.label_ids", [...watch("work_item.label_ids"), response.id]);
        }}
      />
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* State */}
          <Controller
            control={control}
            name="work_item.state_id"
            render={({ field: { value, onChange } }) => (
              <div className="h-7">
                <StateDropdown
                  value={value}
                  onChange={(stateId) => {
                    onChange(stateId);
                    handleTemplateInvalidIdsChange("state_id", null);
                  }}
                  projectId={projectId ?? undefined}
                  buttonVariant="border-with-text"
                  buttonClassName={cn(COMMON_BUTTON_CLASS_NAME, {
                    [COMMON_ERROR_CLASS_NAME]: Boolean(errors?.work_item?.state_id || templateInvalidIds?.state_id),
                  })}
                  alwaysAllowStateChange
                  disabled={!projectId}
                />
              </div>
            )}
          />

          {/* Priority */}
          <Controller
            control={control}
            name="work_item.priority"
            render={({ field: { value, onChange } }) => (
              <div className="h-7">
                <PriorityDropdown
                  value={value}
                  onChange={(priority) => {
                    onChange(priority);
                  }}
                  buttonVariant="border-with-text"
                  buttonClassName={cn("shadow-sm", {
                    [COMMON_BUTTON_CLASS_NAME]: !value || value === "none",
                  })}
                  disabled={!projectId}
                />
              </div>
            )}
          />

          {/* Assignee */}
          <Controller
            control={control}
            name="work_item.assignee_ids"
            render={({ field: { value, onChange } }) => (
              <div className="h-7">
                <MemberDropdown
                  projectId={projectId ?? undefined}
                  value={value}
                  onChange={(assigneeIds) => {
                    onChange(assigneeIds);
                    handleTemplateInvalidIdsChange("assignee_ids", []);
                  }}
                  buttonVariant={value?.length > 0 ? "transparent-without-text" : "border-with-text"}
                  buttonClassName={cn({
                    "hover:bg-transparent": value?.length > 0,
                    [COMMON_BUTTON_CLASS_NAME]: !value || value?.length === 0,
                    [COMMON_ERROR_CLASS_NAME]: Boolean(
                      errors?.work_item?.assignee_ids ||
                        (templateInvalidIds?.assignee_ids && templateInvalidIds?.assignee_ids?.length > 0)
                    ),
                  })}
                  placeholder={t("assignees")}
                  multiple
                  disabled={!projectId}
                />
              </div>
            )}
          />

          {/* Labels */}
          <Controller
            control={control}
            name="work_item.label_ids"
            disabled={!projectId}
            render={({ field: { value, onChange } }) => (
              <div className="h-7">
                <IssueLabelSelect
                  setIsOpen={setIsCreateLabelModalOpen}
                  value={value}
                  onChange={(labelIds) => {
                    onChange(labelIds);
                    handleTemplateInvalidIdsChange("label_ids", []);
                  }}
                  projectId={projectId ?? undefined}
                  createLabelEnabled={canCreateLabel}
                  buttonClassName={cn(COMMON_BUTTON_CLASS_NAME, {
                    [COMMON_ERROR_CLASS_NAME]: Boolean(
                      errors?.work_item?.label_ids ||
                        (templateInvalidIds?.label_ids && templateInvalidIds?.label_ids?.length > 0)
                    ),
                  })}
                  disabled={!projectId}
                />
              </div>
            )}
          />

          {/* Module */}
          {projectDetails?.module_view && workspaceSlug && (
            <Controller
              control={control}
              name="work_item.module_ids"
              render={({ field: { value, onChange } }) => (
                <div className="h-7">
                  <ModuleDropdown
                    projectId={projectId ?? undefined}
                    value={value ?? []}
                    onChange={(moduleIds) => {
                      onChange(moduleIds);
                      handleTemplateInvalidIdsChange("module_ids", []);
                    }}
                    placeholder={t("modules")}
                    buttonVariant="border-with-text"
                    buttonClassName={cn(COMMON_BUTTON_CLASS_NAME, {
                      [COMMON_ERROR_CLASS_NAME]: Boolean(
                        errors?.work_item?.module_ids ||
                          (templateInvalidIds?.module_ids && templateInvalidIds?.module_ids?.length > 0)
                      ),
                    })}
                    multiple
                    showCount
                    disabled={!projectId}
                  />
                </div>
              )}
            />
          )}

          {/* Parent */}
          <div className="h-7">
            {parentId ? (
              <CustomMenu
                customButton={
                  <button type="button" className={cn(PARENT_BUTTON_CLASS_NAME)}>
                    {selectedParentIssue?.project_id && (
                      <IssueIdentifier
                        projectId={selectedParentIssue.project_id}
                        issueTypeId={selectedParentIssue.type_id}
                        projectIdentifier={selectedParentIssue?.project__identifier}
                        issueSequenceId={selectedParentIssue.sequence_id}
                        textContainerClassName="text-xs"
                      />
                    )}
                  </button>
                }
                placement="bottom-start"
                className="h-full w-full"
                customButtonClassName="h-full"
              >
                <>
                  <CustomMenu.MenuItem className="!p-1" onClick={() => setIsParentIssueListModalOpen(true)}>
                    {t("change_parent_issue")}
                  </CustomMenu.MenuItem>
                  <Controller
                    control={control}
                    name={"work_item.parent_id"}
                    render={({ field: { onChange } }) => (
                      <CustomMenu.MenuItem
                        className="!p-1"
                        onClick={() => {
                          onChange(null);
                          setSelectedParentIssue(null);
                        }}
                      >
                        {t("remove_parent_issue")}
                      </CustomMenu.MenuItem>
                    )}
                  />
                </>
              </CustomMenu>
            ) : (
              <button
                type="button"
                onClick={() => setIsParentIssueListModalOpen(true)}
                className={cn(PARENT_BUTTON_CLASS_NAME, {
                  [COMMON_ERROR_CLASS_NAME]: Boolean(errors?.work_item?.parent_id || templateInvalidIds?.parent_id),
                })}
              >
                <LayoutPanelTop className="h-3 w-3 flex-shrink-0" />
                <span className="whitespace-nowrap">{t("add_parent")}</span>
              </button>
            )}
          </div>
          <Controller
            control={control}
            name="work_item.parent_id"
            render={({ field: { onChange } }) => (
              <ParentIssuesListModal
                isOpen={isParentIssueListModalOpen}
                handleClose={() => setIsParentIssueListModalOpen(false)}
                onChange={(issue) => {
                  onChange(issue.id);
                  handleTemplateInvalidIdsChange("parent_id", null);
                  setSelectedParentIssue(issue);
                }}
                projectId={projectId ?? undefined}
                searchEpic
              />
            )}
          />
        </div>
      </div>
    </>
  );
});
