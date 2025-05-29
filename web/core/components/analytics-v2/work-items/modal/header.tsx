import { observer } from "mobx-react";
// plane package imports
import { Expand, Shrink, X } from "lucide-react";
import { ICycle, IModule } from "@plane/types";
// icons

type Props = {
  fullScreen: boolean;
  handleClose: () => void;
  setFullScreen: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  cycle?: ICycle;
  module?: IModule;
};

export const WorkItemsModalHeader: React.FC<Props> = observer((props) => {
  const { fullScreen, handleClose, setFullScreen, title, cycle, module } = props;

  return (
    <div className="flex items-center justify-between gap-4 bg-custom-background-100 px-5 py-4 text-sm">
      <h3 className="break-words">
        Analytics for {title} {cycle && `in ${cycle.name}`} {module && `in ${module.name}`}
      </h3>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="hidden place-items-center p-1 text-custom-text-200 hover:text-custom-text-100 md:grid"
          onClick={() => setFullScreen((prevData) => !prevData)}
        >
          {fullScreen ? <Shrink size={14} strokeWidth={2} /> : <Expand size={14} strokeWidth={2} />}
        </button>
        <button
          type="button"
          className="grid place-items-center p-1 text-custom-text-200 hover:text-custom-text-100"
          onClick={handleClose}
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
});
