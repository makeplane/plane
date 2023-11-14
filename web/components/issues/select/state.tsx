import React from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { CustomSearchSelect, DoubleCircleIcon, StateGroupIcon } from "@plane/ui";
// icons
import { Plus } from "lucide-react";

type Props = {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  onChange: (value: string) => void;
  projectId: string;
};

export const IssueStateSelect: React.FC<Props> = observer((props) => {
  const { setIsOpen, value, onChange, projectId } = props;

  // states
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const {
    projectState: { states: projectStates, fetchProjectStates },
  } = useMobxStore();

  useSWR(
    workspaceSlug && projectId ? `STATES_LIST_${projectId.toUpperCase()}` : null,
    workspaceSlug && projectId ? () => fetchProjectStates(workspaceSlug.toString(), projectId) : null
  );

  const states = projectStates?.[projectId] || [];

  const options = states?.map((state) => ({
    value: state.id,
    query: state.name,
    content: (
      <div className="flex items-center gap-2">
        <StateGroupIcon stateGroup={state.group} color={state.color} />
        {state.name}
      </div>
    ),
  }));

  const selectedOption = states?.find((s) => s.id === value);
  const currentDefaultState = states?.find((s) => s.default);

  return (
    <CustomSearchSelect
      value={value}
      onChange={onChange}
      options={options}
      label={
        <div className="flex items-center gap-1 text-custom-text-200">
          {selectedOption ? (
            <StateGroupIcon stateGroup={selectedOption.group} color={selectedOption.color} />
          ) : currentDefaultState ? (
            <StateGroupIcon stateGroup={currentDefaultState.group} color={currentDefaultState.color} />
          ) : (
            <DoubleCircleIcon className="h-3 w-3" />
          )}
          {selectedOption?.name ? selectedOption.name : currentDefaultState?.name ?? <span>State</span>}
        </div>
      }
      footerOption={
        <button
          type="button"
          className="flex w-full select-none items-center gap-2 rounded px-1 py-1.5 text-xs text-custom-text-200 hover:bg-custom-background-80"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create New State
        </button>
      }
      noChevron
    />
  );
});
