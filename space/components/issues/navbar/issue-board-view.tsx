"use client";

// next imports
import { useRouter, useParams } from "next/navigation";
// mobx react lite
import { observer } from "mobx-react-lite";
// constants
import { issueViews } from "constants/data";
// interfaces
import { TIssueBoardKeys } from "store/types";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const NavbarIssueBoardView = observer(() => {
  const store: RootStore = useMobxStore();

  const router = useRouter();
  const routerParams = useParams();

  const { workspace_slug, project_slug } = routerParams as { workspace_slug: string; project_slug: string };

  const handleCurrentBoardView = (boardView: TIssueBoardKeys) => {
    store?.issue?.setCurrentIssueBoardView(boardView);
    router.replace(`/${workspace_slug}/${project_slug}?board=${boardView}`);
  };

  return (
    <>
      {store?.project?.workspaceProjectSettings &&
        issueViews &&
        issueViews.length > 0 &&
        issueViews.map(
          (_view) =>
            store?.project?.workspaceProjectSettings?.views[_view?.key] && (
              <div
                key={_view?.key}
                className={`w-[28px] h-[28px] flex justify-center items-center rounded-sm cursor-pointer text-gray-500 ${
                  _view?.key === store?.issue?.currentIssueBoardView
                    ? `bg-gray-200/60 text-gray-800`
                    : `hover:bg-gray-200/60 text-gray-600`
                }`}
                onClick={() => handleCurrentBoardView(_view?.key)}
                title={_view?.title}
              >
                <span className={`material-symbols-rounded text-[18px] ${_view?.className ? _view?.className : ``}`}>
                  {_view?.icon}
                </span>
              </div>
            )
        )}
    </>
  );
});
