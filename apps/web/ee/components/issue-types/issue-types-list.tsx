import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EWorkItemTypeEntity } from "@plane/types";
import { Loader } from "@plane/ui";
// plane web imports
import { useIssueType, useIssueTypes } from "@/plane-web/hooks/store";
// local imports
import { IssueTypeListItem } from "./issue-type-list-item";

type TIssueTypesList = {
  onEditIssueTypeIdChange: (issueTypeId: string) => void;
  onDeleteIssueTypeIdChange: (issueTypeId: string) => void;
  onEnableDisableIssueType: (issueTypeId: string) => Promise<void>;
};

export const IssueTypesList = observer((props: TIssueTypesList) => {
  const { onEditIssueTypeIdChange, onDeleteIssueTypeIdChange, onEnableDisableIssueType } = props;
  // router
  const { projectId } = useParams();
  // states
  const [openIssueTypeId, setOpenIssueTypeId] = useState<string | null>(null);
  // store hooks
  const {
    loader: issueTypesLoader,
    getProjectIssueTypeIds,
    getProjectDefaultIssueType,
    getProjectWorkItemPropertiesLoader,
  } = useIssueTypes();
  // derived states
  const currentProjectIssueTypeIds = getProjectIssueTypeIds(projectId?.toString());
  const currentProjectDefaultIssueType = getProjectDefaultIssueType(projectId?.toString());
  // handlers
  const handleIssueTypeListToggle = (issueTypeId: string) => {
    setOpenIssueTypeId((prev) => (prev === issueTypeId ? null : issueTypeId));
  };

  if (issueTypesLoader === "init-loader") {
    return (
      <Loader className="space-y-6 py-2">
        <Loader className="space-y-2">
          <Loader.Item height="60px" />
          <Loader.Item height="240px" />
        </Loader>
        <Loader.Item height="60px" />
        <Loader.Item height="60px" />
      </Loader>
    );
  }

  return (
    <div>
      {currentProjectIssueTypeIds &&
        currentProjectIssueTypeIds.map((issueTypeId) => (
          <IssueTypeListItem
            key={issueTypeId}
            issueTypeId={issueTypeId}
            isOpen={
              openIssueTypeId === issueTypeId ||
              (issueTypeId === currentProjectDefaultIssueType?.id && currentProjectIssueTypeIds.length === 1)
            }
            isCollapseDisabled={
              issueTypeId === currentProjectDefaultIssueType?.id && currentProjectIssueTypeIds.length === 1
            }
            propertiesLoader={getProjectWorkItemPropertiesLoader(projectId?.toString(), EWorkItemTypeEntity.WORK_ITEM)}
            onToggle={handleIssueTypeListToggle}
            onEditIssueTypeIdChange={onEditIssueTypeIdChange}
            getWorkItemTypeById={useIssueType}
            onDeleteIssueTypeIdChange={onDeleteIssueTypeIdChange}
            onEnableDisableIssueType={onEnableDisableIssueType}
          />
        ))}
    </div>
  );
});
