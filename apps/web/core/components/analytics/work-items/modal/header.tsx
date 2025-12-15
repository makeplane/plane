import { observer } from "mobx-react";
// plane package imports
import { Expand, Shrink } from "lucide-react";
import { CloseIcon } from "@plane/propel/icons";
import type { ICycle, IModule } from "@plane/types";
// icons

type Props = {
  fullScreen: boolean;
  handleClose: () => void;
  setFullScreen: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  cycle?: ICycle;
  module?: IModule;
};

export const WorkItemsModalHeader = observer(function WorkItemsModalHeader(props: Props) {
  const { fullScreen, handleClose, setFullScreen, title, cycle, module } = props;

  return (
    <div className="flex items-center justify-between gap-4 bg-surface-1 px-5 py-4 text-13">
      <h3 className="break-words">
        Analytics for {title} {cycle && `in ${cycle.name}`} {module && `in ${module.name}`}
      </h3>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="hidden place-items-center p-1 text-secondary hover:text-primary md:grid"
          onClick={() => setFullScreen((prevData) => !prevData)}
        >
          {fullScreen ? <Shrink size={14} strokeWidth={2} /> : <Expand size={14} strokeWidth={2} />}
        </button>
        <button
          type="button"
          className="grid place-items-center p-1 text-secondary hover:text-primary"
          onClick={handleClose}
        >
          <CloseIcon height={14} width={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
});
