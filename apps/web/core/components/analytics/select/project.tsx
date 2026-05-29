import { observer } from "mobx-react";
// plane package imports
import { getButtonStyling } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ChevronDownIcon, ProjectIcon } from "@plane/propel/icons";
import { CustomSearchSelect } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  value: string[] | undefined;
  onChange: (val: string[] | null) => void;
  projectIds: string[] | undefined;
};

export const ProjectSelect = observer(function ProjectSelect(props: Props) {
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
      className="border-none p-0"
      customButton={
        <div className={cn(getButtonStyling("secondary", "lg"), "gap-2")}>
          <ProjectIcon className="h-4 w-4" />
          {value && value.length > 3
            ? `3+ projects`
            : value && value.length > 0
              ? projectIds
                  ?.filter((p) => value.includes(p))
                  .map((p) => getProjectById(p)?.name)
                  .join(", ")
              : "All projects"}
          <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
        </div>
      }
      customButtonClassName="border-none p-0 bg-transparent hover:bg-transparent w-auto h-auto"
      multiple
    />
  );
});
