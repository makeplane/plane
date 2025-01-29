import { Command } from "cmdk";
import { useParams } from "next/navigation";
import { Search } from "lucide-react";
// plane hooks
import { usePlatformOS } from "@plane/hooks";
// plane ui
import { ToggleSwitch, Tooltip } from "@plane/ui";
// helpers
import { getTabIndex } from "@/helpers/tab-indices.helper";

type Props = {
  handleUpdateSearchTerm: (value: string) => void;
  isWorkspaceLevel: boolean;
  placeholder: string;
  searchTerm: string;
  toggleWorkspaceLevel: () => void;
};

export const PowerKSearchInput: React.FC<Props> = (props) => {
  const { handleUpdateSearchTerm, isWorkspaceLevel, placeholder, searchTerm, toggleWorkspaceLevel } = props;
  // navigation
  const { projectId } = useParams();
  // platform os
  const { isMobile } = usePlatformOS();
  // tab index
  const { baseTabIndex } = getTabIndex(undefined, isMobile);

  return (
    <div className="flex items-center gap-2 p-4 border-b border-custom-border-200">
      <Search className="flex-shrink-0 size-4 stroke-2 text-custom-text-200" aria-hidden="true" />
      <Command.Input
        className="w-full border-0 bg-transparent text-sm text-custom-text-100 outline-none placeholder:text-custom-text-400 focus:ring-0"
        placeholder={placeholder}
        value={searchTerm}
        onValueChange={handleUpdateSearchTerm}
        autoFocus
        tabIndex={baseTabIndex}
      />
      {projectId && (
        <Tooltip tooltipContent="Toggle workspace level search" isMobile={isMobile}>
          <div className="flex-shrink-0 flex items-center gap-1 text-xs">
            <button type="button" onClick={toggleWorkspaceLevel} className="flex-shrink-0">
              Workspace level
            </button>
            <ToggleSwitch value={isWorkspaceLevel} onChange={toggleWorkspaceLevel} />
          </div>
        </Tooltip>
      )}
    </div>
  );
};
