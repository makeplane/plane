// plane imports
import { Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";

type TProps = {
  children: React.ReactNode;
  isDisabled?: boolean;
  onClick: () => void;
  tooltipMessage?: string;
  variant: "default" | "destructive";
};

export const AutomationDetailsSidebarActionFormHeaderButton: React.FC<TProps> = (props) => {
  const { children, isDisabled, onClick, tooltipMessage, variant } = props;

  return (
    <Tooltip tooltipContent={tooltipMessage} position="left" disabled={!tooltipMessage}>
      <span>
        <button
          type="button"
          className={cn(
            "flex-shrink-0 size-4 rounded grid place-items-center outline-none border-none text-custom-text-300 transition-colors",
            {
              "hover:text-custom-text-100 hover:bg-custom-background-80": variant === "default",
              "hover:text-red-500 hover:bg-red-500/20": variant === "destructive",
              "hover:text-custom-text-300 hover:bg-transparent cursor-not-allowed": isDisabled,
            }
          )}
          onClick={onClick}
          disabled={isDisabled}
        >
          {children}
        </button>
      </span>
    </Tooltip>
  );
};
