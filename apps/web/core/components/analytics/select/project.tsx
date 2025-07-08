"use client";

import { observer } from "mobx-react";
import { Briefcase } from "lucide-react";
// plane package imports
import { CustomSearchSelect, Logo } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store";

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
            <Briefcase className="h-4 w-4" />
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
          <Briefcase className="h-4 w-4" />
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
