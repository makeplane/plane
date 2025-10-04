"use client";

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane types
import { EIssueServiceType, type TIssue } from "@plane/types";
import { setToast, Spinner, TOAST_TYPE } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useModule } from "@/hooks/store/use-module";
// local imports
import { PowerKModulesMenu } from "../../../menus/modules";

type Props = {
  handleClose: () => void;
  workItemDetails: TIssue;
};

export const PowerKWorkItemModulesMenu: React.FC<Props> = observer((props) => {
  const { workItemDetails } = props;
  // navigation
  const { workspaceSlug } = useParams();
  // store hooks
  const { getProjectModuleIds, getModuleById } = useModule();
  const {
    issue: { changeModulesInIssue },
  } = useIssueDetail(EIssueServiceType.ISSUES);
  const {
    issue: { changeModulesInIssue: changeModulesInEpic },
  } = useIssueDetail(EIssueServiceType.EPICS);
  // derived values
  const projectModuleIds = workItemDetails.project_id ? getProjectModuleIds(workItemDetails.project_id) : undefined;
  const modulesList = projectModuleIds ? projectModuleIds.map((moduleId) => getModuleById(moduleId)) : undefined;
  const filteredModulesList = modulesList ? modulesList.filter((module) => !!module) : undefined;
  // handlers
  const changeModulesInEntity = workItemDetails.is_epic ? changeModulesInEpic : changeModulesInIssue;

  const handleUpdateModules = useCallback(
    (moduleId: string) => {
      if (!workspaceSlug || !workItemDetails || !workItemDetails.project_id) return;
      try {
        if (workItemDetails.module_ids?.includes(moduleId)) {
          changeModulesInEntity(
            workspaceSlug.toString(),
            workItemDetails.project_id,
            workItemDetails.id,
            [],
            [moduleId]
          );
        } else {
          changeModulesInEntity(
            workspaceSlug.toString(),
            workItemDetails.project_id,
            workItemDetails.id,
            [moduleId],
            []
          );
        }
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: `${workItemDetails.is_epic ? "Epic" : "Work item"} could not be updated. Please try again.`,
        });
      }
    },
    [changeModulesInEntity, workItemDetails, workspaceSlug]
  );

  if (!filteredModulesList) return <Spinner />;

  return <PowerKModulesMenu modules={filteredModulesList} onSelect={(module) => handleUpdateModules(module.id)} />;
});
