"use client";

import { ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { useModule } from "@/hooks/store";
// types
import { TDropdownProps } from "../types";
// local imports
import { ModuleDropdownBase } from "./base";

type TModuleDropdownProps = TDropdownProps & {
  button?: ReactNode;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
  projectId: string | undefined;
  showCount?: boolean;
  onClose?: () => void;
  renderByDefault?: boolean;
  itemClassName?: string;
} & (
    | {
        multiple: false;
        onChange: (val: string | null) => void;
        value: string | null;
      }
    | {
        multiple: true;
        onChange: (val: string[]) => void;
        value: string[] | null;
      }
  );

export const ModuleDropdown: React.FC<TModuleDropdownProps> = observer((props) => {
  const { projectId } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getModuleById, getProjectModuleIds, fetchModules } = useModule();
  // derived values
  const moduleIds = projectId ? getProjectModuleIds(projectId) : [];

  const onDropdownOpen = () => {
    if (!moduleIds && projectId && workspaceSlug) fetchModules(workspaceSlug.toString(), projectId);
  };

  return (
    <ModuleDropdownBase
      {...props}
      getModuleById={getModuleById}
      moduleIds={moduleIds ?? []}
      onDropdownOpen={onDropdownOpen}
    />
  );
});
