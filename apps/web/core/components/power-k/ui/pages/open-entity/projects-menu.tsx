import { observer } from "mobx-react";
// plane types
import type { IPartialProject } from "@plane/types";
import { Spinner } from "@plane/ui";
// components
import { PowerKProjectsMenu } from "@/components/power-k/menus/projects";
// hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  handleSelect: (project: IPartialProject) => void;
};

export const PowerKOpenProjectMenu = observer(function PowerKOpenProjectMenu(props: Props) {
  const { handleSelect } = props;
  // store hooks
  const { loader, joinedProjectIds, getPartialProjectById } = useProject();
  // derived values
  const projectsList = joinedProjectIds
    ? joinedProjectIds.map((id) => getPartialProjectById(id)).filter((project) => project !== undefined)
    : [];

  if (loader === "init-loader") return <Spinner />;

  return <PowerKProjectsMenu projects={projectsList} onSelect={handleSelect} />;
});
