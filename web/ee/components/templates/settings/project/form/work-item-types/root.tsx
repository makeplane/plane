import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useFormContext } from "react-hook-form";
import { PlusIcon } from "lucide-react";
// plane imports
import { EIssuePropertyType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IIssueProperty, IIssueType, TProjectTemplateForm } from "@plane/types";
import { Button, ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { IssueTypeListItem } from "@/plane-web/components/issue-types";
import { TemplateCollapsibleWrapper } from "@/plane-web/components/templates/settings/common";
// local imports
import { ProjectTemplateWorkItemTypeModal } from "./create-update-modal";

type TProjectWorkItemTypesProps = {
  workspaceSlug: string;
  projectTemplateId: string | undefined;
  getWorkItemTypeById: (workItemTypeId: string) => IIssueType | undefined;
  getCustomPropertyById: (customPropertyId: string) => IIssueProperty<EIssuePropertyType> | undefined;
};

export const ProjectWorkItemTypes = observer((props: TProjectWorkItemTypesProps) => {
  const { workspaceSlug, projectTemplateId, getWorkItemTypeById, getCustomPropertyById } = props;
  // states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editIssueTypeId, setEditIssueTypeId] = useState<string | null>(null);
  const [openIssueTypeId, setOpenIssueTypeId] = useState<string | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // form context
  const { control, watch, setValue } = useFormContext<TProjectTemplateForm>();
  // derived values
  const workItemTypes = watch("project.workitem_types");
  const workItemTypeIds = Object.keys(workItemTypes);
  const defaultWorkItemTypeId = workItemTypeIds.find((workItemTypeId) => workItemTypes[workItemTypeId].is_default);

  // handlers
  const handleIssueTypeListToggle = (issueTypeId: string) => {
    setOpenIssueTypeId((prev) => (prev === issueTypeId ? null : issueTypeId));
  };

  const handleEditIssueTypeIdChange = (issueTypeId: string) => {
    setEditIssueTypeId(issueTypeId);
    setIsModalOpen(true);
  };

  const handleWorkItemTypeListUpdate = (workItemTypeData: IIssueType) => {
    if (workItemTypeData.id && typeof workItemTypeData.id === "string") {
      setValue(
        "project.workitem_types",
        { ...workItemTypes, [workItemTypeData.id]: workItemTypeData },
        {
          shouldDirty: true,
        }
      );
    }
  };

  return (
    <>
      <TemplateCollapsibleWrapper
        title={t("work_item_types.label")}
        actionElement={({ setIsOpen }) => (
          <div className="flex items-center">
            <Button
              variant="link-neutral"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(true);
                setIsModalOpen(true);
              }}
            >
              <PlusIcon className="size-4" />
            </Button>
            <Controller
              control={control}
              name="project.is_issue_type_enabled"
              render={({ field: { value, onChange } }) => (
                <ToggleSwitch value={Boolean(value)} onChange={() => onChange(!value)} size="sm" />
              )}
            />
          </div>
        )}
      >
        {workItemTypeIds.length > 0 && (
          <div>
            {workItemTypeIds.map((workItemTypeId) => (
              <IssueTypeListItem
                key={workItemTypeId}
                issueTypeId={workItemTypeId}
                isOpen={
                  openIssueTypeId === workItemTypeId ||
                  (workItemTypeId === defaultWorkItemTypeId && workItemTypeIds.length === 1)
                }
                isCollapseDisabled={workItemTypeId === defaultWorkItemTypeId && workItemTypeIds.length === 1}
                propertiesLoader={"loaded"}
                containerClassName="border-none"
                onToggle={handleIssueTypeListToggle}
                onEditIssueTypeIdChange={handleEditIssueTypeIdChange}
                getWorkItemTypeById={getWorkItemTypeById}
                getClassName={() =>
                  cn(
                    "bg-custom-background-100 hover:bg-custom-background-100 border border-custom-border-100 rounded-lg"
                  )
                }
              />
            ))}
          </div>
        )}
      </TemplateCollapsibleWrapper>
      <ProjectTemplateWorkItemTypeModal
        workspaceSlug={workspaceSlug}
        projectTemplateId={projectTemplateId}
        workItemTypeId={editIssueTypeId}
        isModalOpen={isModalOpen}
        handleWorkItemTypeListUpdate={handleWorkItemTypeListUpdate}
        handleModalClose={() => {
          setEditIssueTypeId(null);
          setIsModalOpen(false);
        }}
        getWorkItemTypeById={getWorkItemTypeById}
        getCustomPropertyById={getCustomPropertyById}
      />
    </>
  );
});
