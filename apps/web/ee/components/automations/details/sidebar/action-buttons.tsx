import { ChevronLeft, ChevronRight } from "lucide-react";
// plane imports
import { AUTOMATION_TRACKER_ELEMENTS } from "@plane/constants";
import { Button, cn } from "@plane/ui";
// helpers
import { captureClick } from "@/helpers/event-tracker.helper";

type TProps = {
  nextButton?: {
    type?: "button" | "submit";
    label: string;
    isDisabled?: boolean;
    onClick?: () => void | Promise<void>;
    renderIcon?: boolean;
  };
  previousButton?: {
    label: string;
    isDisabled?: boolean;
    onClick?: () => void | Promise<void>;
    renderIcon?: boolean;
  };
  borderPosition?: "top" | "bottom";
};

export const AutomationDetailsSidebarActionButtons: React.FC<TProps> = (props) => {
  const { nextButton, previousButton, borderPosition = "top" } = props;

  return (
    <div
      className={cn("space-y-2 px-4", {
        "pt-4 border-t border-custom-border-200": borderPosition === "top",
        "pb-4 border-b border-custom-border-200": borderPosition === "bottom",
      })}
    >
      <div className="flex items-center justify-end gap-3">
        {previousButton && (
          <Button
            variant="neutral-primary"
            size="sm"
            prependIcon={previousButton.renderIcon === false ? undefined : <ChevronLeft className="size-5" />}
            disabled={previousButton.isDisabled}
            onClick={() => {
              captureClick({ elementName: AUTOMATION_TRACKER_ELEMENTS.SIDEBAR_PREVIOUS_BUTTON });
              previousButton.onClick?.();
            }}
          >
            {previousButton.label}
          </Button>
        )}
        {nextButton && (
          <Button
            type={nextButton.type ?? "button"}
            variant="primary"
            size="sm"
            appendIcon={nextButton.renderIcon === false ? undefined : <ChevronRight className="size-5" />}
            disabled={nextButton.isDisabled}
            onClick={() => {
              captureClick({ elementName: AUTOMATION_TRACKER_ELEMENTS.SIDEBAR_NEXT_BUTTON });
              nextButton.onClick?.();
            }}
          >
            {nextButton.label}
          </Button>
        )}
      </div>
    </div>
  );
};
