import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@plane/ui";

type TProps = {
  nextButton?: {
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
};

export const AutomationDetailsSidebarActionButtons: React.FC<TProps> = (props) => {
  const { nextButton, previousButton } = props;

  return (
    <div className="space-y-2 border-t border-custom-border-200 px-6 pt-4">
      <div className="flex items-center justify-end gap-3">
        {previousButton && (
          <Button
            variant="neutral-primary"
            size="sm"
            prependIcon={previousButton.renderIcon === false ? undefined : <ChevronLeft className="size-5" />}
            disabled={previousButton.isDisabled || !previousButton.onClick}
            onClick={previousButton.onClick}
          >
            {previousButton.label}
          </Button>
        )}
        {nextButton && (
          <Button
            variant="primary"
            size="sm"
            appendIcon={nextButton.renderIcon === false ? undefined : <ChevronRight className="size-5" />}
            disabled={nextButton.isDisabled || !nextButton.onClick}
            onClick={nextButton.onClick}
          >
            {nextButton.label}
          </Button>
        )}
      </div>
    </div>
  );
};
