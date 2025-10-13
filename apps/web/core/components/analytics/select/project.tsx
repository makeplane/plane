"use client";

import { observer } from "mobx-react";
import { ProjectIcon } from "@plane/propel/icons";
// plane package imports
import { CustomSearchSelect } from "@plane/ui";
// components
import { Logo } from "@/components/common/logo";
// hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  value: string[] | undefined;
  onChange: (val: string[] | null) => void;
  projectIds: string[] | undefined;
};

export const ProjectSelect: React.FC<Props> = observer((props) => {
  const { value, onChange, projectIds } = props;
  const { getProjectById } = useProject();

  const options = projectIds?.map((projectId) => {
    const projectDetails = getProjectById(projectId);

    return {
      value: projectDetails?.id,
      query: `${projectDetails?.name} ${projectDetails?.identifier}`,
      content: (
        <div className="flex max-w-[300px] items-center gap-2">
          {projectDetails?.logo_props ? (
            <Logo logo={projectDetails?.logo_props} size={16} />
          ) : (
            <ProjectIcon className="h-4 w-4" />
          )}
          <span className="flex-grow truncate">{projectDetails?.name}</span>
        </div>
      ),
    };
  });

  return (
    <CustomSearchSelect
      value={value ?? []}
      onChange={(val: string[]) => onChange(val)}
      options={options}
      label={
        <div className="flex items-center gap-2 p-1 ">
          <ProjectIcon className="h-4 w-4" />
          {value && value.length > 3
            ? `3+ projects`
            : value && value.length > 0
              ? projectIds
                  ?.filter((p) => value.includes(p))
                  .map((p) => getProjectById(p)?.name)
                  .join(", ")
              : "All projects"}
        </div>
      }
      multiple
    />
  );
});
