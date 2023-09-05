// react
import React, { useState } from "react";

// next
import { useRouter } from "next/router";

// swr
import useSWR from "swr";

// icons
import { ChevronDownIcon } from "@heroicons/react/24/outline";

// services
import stateService from "services/state.service";

// fetch key
import { STATES_LIST } from "constants/fetch-keys";

// components
import { getStateGroupIcon } from "components/icons";
import { WebViewModal } from "./web-view-modal";

// helpers
import { getStatesList } from "helpers/state.helper";

type Props = {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
};

export const StateSelect: React.FC<Props> = (props) => {
  const { value, onChange, disabled = false } = props;

  const [isOpen, setIsOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: stateGroups } = useSWR(
    workspaceSlug && projectId ? STATES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
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
          selectedOption={selectedState?.id || null}
          options={
            states?.map((state) => ({
              label: state.name,
              value: state.id,
              icon: getStateGroupIcon(state.group, "16", "16", state.color),
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
        className={
          "relative w-full px-2.5 py-0.5 text-base flex justify-between items-center gap-0.5 text-custom-text-100"
        }
      >
        {selectedState?.name || "Select a state"}
        <ChevronDownIcon className="w-5 h-5" />
      </button>
    </>
  );
};
