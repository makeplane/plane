import { Link2 } from "lucide-react";

export const LinksEmptyState = () => (
  <div className="min-h-[110px] w-full flex items-center justify-center gap-2 py-6 bg-custom-background-90 text-custom-text-400 rounded">
    <div className="flex-shrink-0 size-[30px] grid place-items-center">
      <Link2 className="size-6 -rotate-45" />
    </div>
    <p className="text-sm text-center font-medium">Save links to work things that you{"'"}d like handy.</p>
  </div>
);
