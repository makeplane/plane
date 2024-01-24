import { useRouter } from "next/router";
import Link from "next/link";
import { observer } from "mobx-react-lite";
// icons
import { PhotoFilterIcon } from "@plane/ui";
// helpers
import { truncateText } from "helpers/string.helper";

type Props = { view: { key: string; label: string } };

export const GlobalDefaultViewListItem: React.FC<Props> = observer((props) => {
  const { view } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <div className="group border-b border-custom-border-200 hover:bg-custom-background-90">
      <Link href={`/${workspaceSlug}/workspace-views/${view.key}`}>
        <div className="relative flex w-full items-center justify-between rounded px-5 py-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-10 w-10 place-items-center rounded bg-custom-background-90 group-hover:bg-custom-background-100">
                <PhotoFilterIcon className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <p className="truncate text-sm font-medium leading-4">{truncateText(view.label, 75)}</p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
});
