import { Plus, StickyNote as StickyIcon } from "lucide-react";
import { Button } from "@plane/ui";

type TProps = {
  handleCreate: () => void;
  creatingSticky?: boolean;
};
export const EmptyState = (props: TProps) => {
  const { handleCreate, creatingSticky } = props;
  return (
    <div className="flex justify-center h-[500px] rounded border-[1.5px] border-custom-border-100 mx-2">
      <div className="m-auto">
        <div
          className={`mb-2 rounded-full mx-auto last:rounded-full w-[50px] h-[50px] flex items-center justify-center bg-custom-background-80/40 transition-transform duration-300`}
        >
          <StickyIcon className="size-[30px] rotate-90 text-custom-text-350/20" />
        </div>
        <div className="text-custom-text-100 font-medium text-lg text-center mb-1">No stickies yet</div>
        <div className="text-custom-text-300 text-sm text-center mb-2">
          All your stickies in this workspace will appear here.
        </div>
        <Button size="sm" variant="accent-primary" className="mx-auto" onClick={handleCreate} disabled={creatingSticky}>
          <Plus className="size-4 my-auto" /> <span>Add sticky</span>
          {creatingSticky && (
            <div className="flex items-center justify-center ml-2">
              <div
                className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-custom-primary-100`}
                role="status"
                aria-label="loading"
              />
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};
