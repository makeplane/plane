import { useRouter } from "next/router";
import Link from "next/link";
import { observer } from "mobx-react-lite";

// icons
import { Sparkles } from "lucide-react";
// helpers
import { truncateText } from "helpers/string.helper";

type Props = { view: { key: string; label: string } };

export const GlobalDefaultViewListItem: React.FC<Props> = observer((props) => {
  const { view } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <div className="group hover:bg-custom-background-90 border-b border-custom-border-200">
      <Link href={`/${workspaceSlug}/workspace-views/${view.key}`}>
        <a className="flex items-center justify-between relative rounded px-5 py-4 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="grid place-items-center h-10 w-10 rounded bg-custom-background-90 group-hover:bg-custom-background-100">
                <Sparkles size={14} strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <p className="truncate text-sm leading-4 font-medium">{truncateText(view.label, 75)}</p>
              </div>
            </div>
          </div>
        </a>
      </Link>
    </div>
  );
});
