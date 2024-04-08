import { Globe2, Lock, LucideIcon } from "lucide-react";
// editor
import { EditorMenuItemNames } from "@plane/editor-document-core";
// ui
import { Button, Tooltip } from "@plane/ui";
// constants
import { TOOLBAR_ITEMS } from "@/constants/editor";
import { EIssueCommentAccessSpecifier } from "@/constants/issue";
// helpers
import { cn } from "@/helpers/common.helper";

type Props = {
  accessSpecifier: EIssueCommentAccessSpecifier;
  executeCommand: (commandName: EditorMenuItemNames) => void;
  handleAccessChange: (accessKey: EIssueCommentAccessSpecifier) => void;
  handleSubmit: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  isActive: (commandName: EditorMenuItemNames) => boolean;
  isCommentEmpty: boolean;
  isSubmitting: boolean;
  showAccessSpecifier?: boolean;
};

type TCommentAccessType = {
  icon: LucideIcon;
  key: EIssueCommentAccessSpecifier;
  label: "Private" | "Public";
};

const COMMENT_ACCESS_SPECIFIERS: TCommentAccessType[] = [
  {
    icon: Lock,
    key: EIssueCommentAccessSpecifier.INTERNAL,
    label: "Private",
  },
  {
    icon: Globe2,
    key: EIssueCommentAccessSpecifier.EXTERNAL,
    label: "Public",
  },
];

const toolbarItems = TOOLBAR_ITEMS.lite;

export const IssueCommentToolbar: React.FC<Props> = (props) => {
  const {
    accessSpecifier,
    executeCommand,
    handleAccessChange,
    handleSubmit,
    isActive,
    isCommentEmpty,
    isSubmitting,
    showAccessSpecifier = false,
  } = props;

  return (
    <div className="flex h-9 w-full items-stretch gap-1.5 overflow-x-scroll">
      {showAccessSpecifier && (
        <div className="flex flex-shrink-0 items-stretch gap-0.5 rounded border-[0.5px] border-custom-border-200 p-1">
          {COMMENT_ACCESS_SPECIFIERS.map((access) => {
            const isAccessActive = accessSpecifier === access.key;

            return (
              <Tooltip key={access.key} tooltipContent={access.label}>
                <button
                  type="button"
                  onClick={() => handleAccessChange(access.key)}
                  className={cn("grid place-items-center aspect-square rounded-sm p-1 hover:bg-custom-background-90", {
                    "bg-custom-background-90": isAccessActive,
                  })}
                >
                  <access.icon
                    className={cn("h-3.5 w-3.5 text-custom-text-400", {
                      "text-custom-text-100": isAccessActive,
                    })}
                    strokeWidth={2}
                  />
                </button>
              </Tooltip>
            );
          })}
        </div>
      )}
      <div className="flex w-full items-stretch justify-between gap-2 rounded border-[0.5px] border-custom-border-200 bg-custom-background-90 p-1">
        <div className="flex items-stretch">
          {Object.keys(toolbarItems).map((key) => (
            <div key={key} className="flex items-stretch gap-0.5 border-r border-custom-border-200 pr-2.5">
              {toolbarItems[key].map((item) => (
                <Tooltip
                  key={item.key}
                  tooltipContent={
                    <p className="flex flex-col gap-1 text-center text-xs">
                      <span className="font-medium">{item.name}</span>
                      {item.shortcut && <kbd className="text-custom-text-400">{item.shortcut.join(" + ")}</kbd>}
                    </p>
                  }
                >
                  <button
                    type="button"
                    onClick={() => executeCommand(item.key)}
                    className={cn(
                      "grid aspect-square place-items-center rounded-sm p-1 text-custom-text-400 hover:bg-custom-background-80",
                      {
                        "bg-custom-background-80 text-custom-text-100": isActive(item.key),
                      }
                    )}
                  >
                    <item.icon
                      className={cn("h-3.5 w-3.5", {
                        "text-custom-text-100": isActive(item.key),
                      })}
                      strokeWidth={2.5}
                    />
                  </button>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
        <div className="sticky right-1">
          <Button
            type="submit"
            variant="primary"
            className="px-2.5 py-1.5 text-xs"
            onClick={handleSubmit}
            disabled={isCommentEmpty}
            loading={isSubmitting}
          >
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
};
