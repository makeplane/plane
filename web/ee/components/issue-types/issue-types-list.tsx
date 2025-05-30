import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { useParams } from "next/navigation";
import { EWorkItemTypeEntity } from "@plane/constants";
import { Loader } from "@plane/ui";
// plane web components
import { IssueTypeListItem } from "@/plane-web/components/issue-types";
// plane web hooks
import { useIssueType, useIssueTypes } from "@/plane-web/hooks/store";

type TIssueTypesList = {
  onEditIssueTypeIdChange: (issueTypeId: string) => void;
};

export const IssueTypesList = observer((props: TIssueTypesList) => {
  const { onEditIssueTypeIdChange } = props;
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
          />
        ))}
    </div>
  );
});
