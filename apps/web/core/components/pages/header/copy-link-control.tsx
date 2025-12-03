import { observer } from "mobx-react";
import { Link } from "lucide-react";
// hooks
import { usePageOperations } from "@/hooks/use-page-operations";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

export const PageCopyLinkControl = observer(function PageCopyLinkControl({ page }: Props) {
  // page operations
  const { pageOperations } = usePageOperations({
    page,
  });

  return (
    <button
      type="button"
      onClick={pageOperations.copyLink}
      className="flex-shrink-0 size-6 grid place-items-center rounded-sm text-secondary hover:text-primary hover:bg-layer-1 transition-colors"
    >
      <Link className="size-3.5" />
    </button>
  );
});
