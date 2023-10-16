import React, { useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";

// icons
import { ChevronDown } from "lucide-react";
// services
import { ProjectStateService } from "services/project";
// fetch key
import { STATES_LIST } from "constants/fetch-keys";
// components
import { StateGroupIcon } from "components/icons";
import { WebViewModal } from "./web-view-modal";
// helpers
import { getStatesList } from "helpers/state.helper";

type Props = {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
};

// services
const projectStateService = new ProjectStateService();

export const StateSelect: React.FC<Props> = (props) => {
  const { value, onChange, disabled = false } = props;

  const [isOpen, setIsOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: stateGroups } = useSWR(
    workspaceSlug && projectId ? STATES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectStateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );
  const states = getStatesList(stateGroups);

  const selectedState = states?.find((s) => s.id === value);

  return (
    <>
      <WebViewModal
        isOpen={isOpen}
        modalTitle="Select state"
        onClose={() => {
          setIsOpen(false);
        }}
      >
        <WebViewModal.Options
          options={
            states?.map((state) => ({
              label: state.name,
              value: state.id,
              checked: state.id === selectedState?.id,
              icon: <StateGroupIcon stateGroup={state.group} color={state.color} />,
              onClick: () => {
                setIsOpen(false);
                if (disabled) return;
                onChange(state.id);
              },
            })) || []
          }
        />
      </WebViewModal>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={"relative w-full px-2.5 py-0.5 text-base flex justify-between items-center gap-0.5"}
      >
        <span className="text-custom-text-200">{selectedState?.name || "Select a state"}</span>
        <ChevronDown className="w-4 h-4 text-custom-text-200" />
      </button>
    </>
  );
};
