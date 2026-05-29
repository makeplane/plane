import { observer } from "mobx-react";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterTeamProjects = observer(function FilterTeamProjects(_props: Props) {
  return null;
});
