// react
import React, { useState } from "react";

// icons
import { ChevronDownIcon, PlayIcon } from "lucide-react";

// hooks
import useEstimateOption from "hooks/use-estimate-option";

// components
import { WebViewModal } from "./web-view-modal";

type Props = {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
};

export const EstimateSelect: React.FC<Props> = (props) => {
  const { value, onChange, disabled = false } = props;

  const [isOpen, setIsOpen] = useState(false);

  const { estimatePoints } = useEstimateOption();

  return (
    <>
      <WebViewModal
        isOpen={isOpen}
        modalTitle="Select estimate"
        onClose={() => {
          setIsOpen(false);
        }}
      >
        <WebViewModal.Options
          options={[
            {
              label: "None",
              value: null,
              checked: value === null,
              onClick: () => {
                setIsOpen(false);
                if (disabled) return;
                onChange(null);
              },
              icon: <PlayIcon className="h-4 w-4 -rotate-90" />,
            },
            ...estimatePoints?.map((point) => ({
              label: point.value,
              value: point.key,
              checked: point.key === value,
              icon: <PlayIcon className="h-4 w-4 -rotate-90" />,
              onClick: () => {
                setIsOpen(false);
                if (disabled) return;
                onChange(point.key);
              },
            })),
          ]}
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
        {value ? (
          <div className="flex items-center gap-x-1.5">
            <PlayIcon className="h-4 w-4 -rotate-90" />
            <span>{estimatePoints?.find((e) => e.key === value)?.value}</span>
          </div>
        ) : (
          "No estimate"
        )}
        <ChevronDownIcon className="w-5 h-5" />
      </button>
    </>
  );
};
