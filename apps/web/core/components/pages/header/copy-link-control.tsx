import { observer } from "mobx-react";

import { LinkIcon } from "@plane/propel/icons";
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
      className="flex-shrink-0 size-6 grid place-items-center rounded text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors"
    >
      <LinkIcon className="size-3.5" />
    </button>
  );
});
