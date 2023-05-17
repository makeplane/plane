// ui
import { CustomSearchSelect } from "components/ui";
// types
import { IProject } from "types";

type Props = {
  value: string[] | null | undefined;
  onChange: (val: string[] | null) => void;
  projects: IProject[];
};

export const SelectProject: React.FC<Props> = ({ value, onChange, projects }) => {
  const options = projects?.map((project) => ({
    value: project.id,
    query: project.name + project.identifier,
    content: <>{project.name}</>,
  }));

  return (
    <CustomSearchSelect
      value={value ?? []}
      onChange={(val: string[]) => onChange(val)}
      options={options}
      label={
        value && value.length > 0
          ? projects
              .filter((p) => value.includes(p.id))
              .map((p) => p.identifier)
              .join(", ")
          : "All projects"
      }
      optionsClassName="min-w-full"
      noChevron
      multiple
    />
  );
};
