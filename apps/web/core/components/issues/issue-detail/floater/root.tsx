import { observer } from "mobx-react";

export const WorkItemFloaterRoot = observer(function WorkItemFloaterRoot() {
  return (
    <div className="sticky bottom-8 pt-8 flex items-center justify-center">
      <div className="bg-custom-background-90 border-[0.5px] border-custom-border-300 rounded-xl h-11">
        Work Item Floater
      </div>
    </div>
  );
});
