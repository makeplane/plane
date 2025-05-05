"use client";

import { observer } from "mobx-react";
// hooks
import { Briefcase } from "lucide-react";
import { CustomSearchSelect } from "@plane/ui";
import { useProject } from "@/hooks/store";
// ui

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
        <div className="flex items-center gap-2 max-w-[300px]">
          <span className="text-[0.65rem] text-custom-text-200 flex-shrink-0">{projectDetails?.identifier}</span>
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
          <Briefcase className="w-4 h-4" />
          {value && value.length > 3 ?
            `3+ projects`
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
