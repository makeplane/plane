import { Link2 } from "lucide-react";

export const LinksEmptyState = () => (
    <div className="min-h-[110px] flex w-full justify-center py-6 bg-custom-border-100 rounded">
      <div className="m-auto flex gap-2">
        <Link2 size={30} className="text-custom-text-400/40 -rotate-45" />
        <div className="text-custom-text-400 text-sm text-center my-auto">
          Add any links you need for quick access to your work.
        </div>
      </div>
    </div>
  );
