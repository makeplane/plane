// types
import { FC } from "react";
import { CustomerRequestIcon, CustomersIcon, ISvgIcons } from "@plane/propel/icons";
import { IGroupByColumn, IIssueDisplayProperties, TGetColumns, TSpreadsheetColumn } from "@plane/types";
// components
import {
  SpreadSheetPropertyIconMap as CeSpreadSheetPropertyIconMap,
  SPREADSHEET_COLUMNS as CE_SPREAD_SHEET_COLUMNS,
  getScopeMemberIds as getCeScopeMemberIds,
  TGetScopeMemberIdsResult,
} from "@/ce/components/issues/issue-layouts/utils";
import { Logo } from "@/components/common/logo";
// store
import { store } from "@/lib/store-context";
import {
  SpreadsheetCustomerColumn,
  SpreadSheetCustomerRequestColumn,
} from "@/plane-web/components/issues/issue-layouts/spreadsheet";

export const getScopeMemberIds = ({ isWorkspaceLevel, projectId }: TGetColumns): TGetScopeMemberIdsResult => {
  // store values
  const { currentTeamspaceMemberIds } = store.teamspaceRoot.teamspaces;

  if (store.router.teamspaceId) {
    return { memberIds: currentTeamspaceMemberIds ?? [], includeNone: false };
  }

  return getCeScopeMemberIds({ isWorkspaceLevel, projectId });
};

export const getTeamProjectColumns = (): IGroupByColumn[] | undefined => {
  const { projectMap } = store.projectRoot.project;
  const { currentTeamspaceProjectIds } = store.teamspaceRoot.teamspaces;
  // Return undefined if no project ids
  if (!currentTeamspaceProjectIds) return;
  // Map project ids to project columns
  return currentTeamspaceProjectIds
    .map((projectId: string) => {
      const project = projectMap[projectId];
      if (!project) return;
      return {
        id: project.id,
        name: project.name,
        icon: (
          <div className="w-6 h-6 grid place-items-center flex-shrink-0">
            <Logo logo={project.logo_props} />
          </div>
        ),
        payload: { project_id: project.id },
      };
    })
    .filter((column) => column !== undefined) as IGroupByColumn[];
};

export const SpreadSheetPropertyIconMap: Record<string, FC<ISvgIcons>> = {
  ...CeSpreadSheetPropertyIconMap,
  CustomersIcon: CustomersIcon,
  CustomerRequestIcon: CustomerRequestIcon,
};

export const SPREADSHEET_COLUMNS: { [key in keyof IIssueDisplayProperties]: TSpreadsheetColumn } = {
  ...CE_SPREAD_SHEET_COLUMNS,
  customer_count: SpreadsheetCustomerColumn,
  customer_request_count: SpreadSheetCustomerRequestColumn,
};
