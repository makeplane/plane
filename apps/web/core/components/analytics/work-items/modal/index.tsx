import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane package imports
import { createPortal } from "react-dom";
import { ICycle, IModule, IProject } from "@plane/types";
import { cn } from "@plane/utils";
import { useAnalytics } from "@/hooks/store/use-analytics";
// plane web components
import { WorkItemsModalMainContent } from "./content";
import { WorkItemsModalHeader } from "./header";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  projectDetails?: IProject | undefined;
  cycleDetails?: ICycle | undefined;
  moduleDetails?: IModule | undefined;
  isEpic?: boolean;
};

export const WorkItemsModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose, projectDetails, moduleDetails, cycleDetails, isEpic } = props;
  const { updateIsEpic, isPeekView } = useAnalytics();
  const [fullScreen, setFullScreen] = useState(false);

  const handleClose = () => {
    setFullScreen(false);
    onClose();
  };

  useEffect(() => {
    updateIsEpic(isPeekView ? (isEpic ?? false) : false);
  }, [isEpic, updateIsEpic, isPeekView]);

  const portalContainer = document.getElementById("full-screen-portal") as HTMLElement;

  if (!isOpen) return null;

  const content = (
    <div className={cn("z-[25] h-full w-full overflow-y-auto absolute")}>
      <div
        className={`top-0 right-0 z-[25] h-full bg-custom-background-100 shadow-custom-shadow-md absolute ${
          fullScreen ? "w-full p-2" : "w-1/2"
        }`}
      >
        <div
          className={`flex h-full flex-col overflow-hidden border-custom-border-200 bg-custom-background-100 text-left ${
            fullScreen ? "rounded-lg border" : "border-l"
          }`}
        >
          <WorkItemsModalHeader
            fullScreen={fullScreen}
            handleClose={handleClose}
            setFullScreen={setFullScreen}
            title={projectDetails?.name ?? ""}
            cycle={cycleDetails}
            module={moduleDetails}
          />
          <WorkItemsModalMainContent
            fullScreen={fullScreen}
            projectDetails={projectDetails}
            cycleDetails={cycleDetails}
            moduleDetails={moduleDetails}
            isEpic={isEpic}
          />
        </div>
      </div>
    </div>
  );

  return portalContainer ? createPortal(content, portalContainer) : content;
});
