import { Plus, StickyNote as StickyIcon, X } from "lucide-react";

type TProps = {
  handleCreate: () => void;
  creatingSticky?: boolean;
};
export const EmptyState = (props: TProps) => {
  const { handleCreate, creatingSticky } = props;
  return (
    <div className="flex justify-center h-[500px]">
      <div className="m-auto">
        <div
          className={`mb-4 rounded-full mx-auto last:rounded-full w-[98px] h-[98px] flex items-center justify-center bg-custom-background-80/40 transition-transform duration-300`}
        >
          <StickyIcon className="size-[60px] rotate-90 text-custom-text-350/20" />
        </div>
        <div className="text-custom-text-100 font-medium text-lg text-center">No stickies yet</div>
        <div className="text-custom-text-300 text-sm text-center my-2">
          All your stickies in this workspace will appear here.
        </div>
        <button
          onClick={handleCreate}
          className="mx-auto flex gap-1 text-sm font-medium text-custom-primary-100 my-auto"
          disabled={creatingSticky}
        >
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
        </button>
      </div>
    </div>
  );
};
