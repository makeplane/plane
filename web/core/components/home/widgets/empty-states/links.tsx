import { Link2, Plus } from "lucide-react";
import { Button } from "@plane/ui";

type TProps = {
  handleCreate: () => void;
};
export const LinksEmptyState = (props: TProps) => {
  const { handleCreate } = props;
  return (
    <div className="min-h-[200px] flex w-full justify-center py-6 border-[1.5px] border-custom-border-100 rounded">
      <div className="m-auto">
        <div
          className={`mb-2 rounded-full mx-auto last:rounded-full w-[50px] h-[50px] flex items-center justify-center bg-custom-background-80/40 transition-transform duration-300`}
        >
          <Link2 size={30} className="text-custom-text-400 -rotate-45" />
        </div>
        <div className="text-custom-text-100 font-medium text-base text-center mb-1">No quick links yet</div>
        <div className="text-custom-text-300 text-sm text-center mb-2">
          Add any links you need for quick access to your work.{" "}
        </div>
        <Button variant="accent-primary" size="sm" onClick={handleCreate} className="mx-auto">
          <Plus className="size-4 my-auto" /> <span>Add quick link</span>
        </Button>
      </div>
    </div>
  );
};
