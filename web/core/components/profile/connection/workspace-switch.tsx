import { IWorkspace } from "@plane/types";
import { CustomSelect } from "@plane/ui";

type WorkspaceSwitchProps = {
  workspaces: Record<string, IWorkspace>;
  value: IWorkspace | null;
  onChange: (value: IWorkspace) => void;
};

export function WorkspaceSwitch(props: WorkspaceSwitchProps) {
  const { workspaces, value, onChange } = props;

  const workspacesList = Object.values(workspaces ?? {});

  return (
    <CustomSelect value={value} label={value === null ? "Select workspaces" : value.name} onChange={onChange} input>
      {workspacesList.map((workspace) => (
        <CustomSelect.Option key={workspace.name} value={workspace}>
          <div className="flex items-center gap-2">{workspace.name}</div>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
}
