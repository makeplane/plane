import { useRef } from "react";
import { observer } from "mobx-react";
// types
import { useUserPermissions } from "@/hooks/store";
import { IProjectDisplayProperties, SPREADSHEET_PROPERTY_DETAILS } from "@/plane-web/constants/project/spreadsheet";
import { TProject } from "@/plane-web/types/projects";
import { EUserPermissions } from "@plane/types/src/enums";

type Props = {
  projectDetails: TProject;
  disableUserActions: boolean;
  property: keyof IProjectDisplayProperties;
  updateProject: ((projectId: string | null, data: Partial<TProject>) => Promise<TProject>) | undefined;
};

export const ProjectColumn = observer((props: Props) => {
  const { projectDetails, property, updateProject } = props;
  // router
  const tableCellRef = useRef<HTMLTableCellElement | null>(null);
  const { workspaceProjectsPermissions } = useUserPermissions();
  const { Column } = SPREADSHEET_PROPERTY_DETAILS[property];
  const isEditingAllowed =
    workspaceProjectsPermissions &&
    workspaceProjectsPermissions[projectDetails.workspace_detail.slug][projectDetails.id] &&
    workspaceProjectsPermissions[projectDetails.workspace_detail.slug][projectDetails.id] >= EUserPermissions.ADMIN;
  return (
    <td
      tabIndex={0}
      className="h-11 w-full min-w-36 max-w-48 text-sm after:absolute after:w-full after:bottom-[-1px] after:border after:border-custom-border-100 border-r-[1px] border-custom-border-100"
      ref={tableCellRef}
    >
      <Column
        project={projectDetails}
        onChange={(project: TProject, data: Partial<TProject>) => {
          console.log(JSON.parse(JSON.stringify(project)), data);
          updateProject && updateProject(project.id, data);
        }}
        disabled={!isEditingAllowed}
      />
    </td>
  );
});
