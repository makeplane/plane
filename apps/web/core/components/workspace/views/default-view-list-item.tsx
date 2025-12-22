import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@plane/i18n";
// helpers
import { truncateText } from "@plane/utils";

type Props = { view: { key: string; i18n_label: string } };

export const GlobalDefaultViewListItem = observer(function GlobalDefaultViewListItem(props: Props) {
  const { view } = props;
  // router
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();

  return (
    <div className="group border-b border-subtle hover:bg-surface-2">
      <Link href={`/${workspaceSlug}/workspace-views/${view.key}`}>
        <div className="relative flex w-full h-[52px] items-center justify-between rounded-sm px-5 py-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <p className="truncate text-13 font-medium leading-4">{truncateText(t(view.i18n_label), 75)}</p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
});
