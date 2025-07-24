import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane package imports
import { createPortal } from "react-dom";
import { ICycle, IModule, IProject } from "@plane/types";
import { cn } from "@plane/utils";
import { useAnalytics } from "@/hooks/store";
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
  const { updateIsEpic } = useAnalytics();
  const [fullScreen, setFullScreen] = useState(false);

  const handleClose = () => {
    setFullScreen(false);
    onClose();
  };

  useEffect(() => {
    updateIsEpic(isEpic ?? false);
  }, [isEpic, updateIsEpic]);

  const portalContainer = document.getElementById("full-screen-portal") as HTMLElement;

  if (!isOpen) return null;

  const content = (
    <div className={cn("inset-0 z-[25] h-full w-full overflow-y-auto", fullScreen ? "absolute" : "fixed")}>
      <div
        className={`right-0 top-0 z-20 h-full bg-custom-background-100 shadow-custom-shadow-md ${
          fullScreen ? "w-full p-2 absolute" : "w-full sm:w-full md:w-1/2 fixed"
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
          />
        </div>
      </div>
    </div>
  );

  return fullScreen && portalContainer ? createPortal(content, portalContainer) : content;
});
