import { useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { EUserProjectRoles } from "@plane/constants";
import { useUserPermissions } from "@/hooks/store";
import { IProjectDisplayProperties, SPREADSHEET_PROPERTY_DETAILS } from "@/plane-web/constants/project/spreadsheet";
import { TProject } from "@/plane-web/types/projects";

type Props = {
  projectDetails: TProject;
  disableUserActions: boolean;
  property: keyof IProjectDisplayProperties;
  updateProject: ((projectId: string | null, data: Partial<TProject>) => Promise<TProject>) | undefined;
};

export const ProjectColumn = observer((props: Props) => {
  const { projectDetails, property, updateProject } = props;
  // router
  const { workspaceSlug } = useParams();
  // refs
  const tableCellRef = useRef<HTMLTableCellElement | null>(null);
  const { workspaceProjectsPermissions } = useUserPermissions();
  const { Column } = SPREADSHEET_PROPERTY_DETAILS[property];
  const isEditingAllowed =
    workspaceProjectsPermissions &&
    workspaceProjectsPermissions[workspaceSlug?.toString()][projectDetails.id] &&
    workspaceProjectsPermissions[workspaceSlug?.toString()][projectDetails.id] >= EUserProjectRoles.ADMIN;

  return (
    <td
      tabIndex={0}
      className="h-11 w-full min-w-36 max-w-48 text-sm after:absolute after:w-full after:bottom-[-1px] after:border after:border-custom-border-100 border-r-[1px] border-custom-border-100"
      ref={tableCellRef}
    >
      <Column
        project={projectDetails}
        onChange={(project: TProject, data: Partial<TProject>) => {
          if (updateProject) {
            updateProject(project.id, data);
          }
        }}
        disabled={!isEditingAllowed}
      />
    </td>
  );
});
