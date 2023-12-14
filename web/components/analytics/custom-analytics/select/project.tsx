import { observer } from "mobx-react-lite";
// hooks
import { useProject } from "hooks/store";
// ui
import { CustomSearchSelect } from "@plane/ui";

type Props = {
  value: string[] | undefined;
  onChange: (val: string[] | null) => void;
  projectIds: string[] | undefined;
};

export const SelectProject: React.FC<Props> = observer((props) => {
  const { value, onChange, projectIds } = props;
  const { getProjectById } = useProject();

  const options = projectIds?.map((projectId) => {
    const projectDetails = getProjectById(projectId);

    return {
      value: projectDetails?.id,
      query: `${projectDetails?.name} ${projectDetails?.identifier}`,
      content: (
        <div className="flex items-center gap-2">
          <span className="text-[0.65rem] text-custom-text-200">{projectDetails?.identifier}</span>
          {projectDetails?.name}
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
        value && value.length > 0
          ? projectIds
              ?.filter((p) => value.includes(p))
              .map((p) => getProjectById(p)?.name)
              .join(", ")
          : "All projects"
      }
      optionsClassName="min-w-full max-w-[20rem]"
      multiple
    />
  );
});
