import { useRouter } from "next/router";
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
  const { workspace_slug, project_slug } = router.query as { workspace_slug: string; project_slug: string };

  const handleCurrentBoardView = (boardView: TIssueBoardKeys) => {
    store?.issue?.setCurrentIssueBoardView(boardView);
    router.replace(
      `/${workspace_slug}/${project_slug}?board=${boardView}${
        store?.issue?.userSelectedLabels && store?.issue?.userSelectedLabels.length > 0
          ? `&labels=${store?.issue?.userSelectedLabels.join(",")}`
          : ""
      }${
        store?.issue?.userSelectedPriorities && store?.issue?.userSelectedPriorities.length > 0
          ? `&priorities=${store?.issue?.userSelectedPriorities.join(",")}`
          : ""
      }${
        store?.issue?.userSelectedStates && store?.issue?.userSelectedStates.length > 0
          ? `&states=${store?.issue?.userSelectedStates.join(",")}`
          : ""
      }`
    );
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
                className={`w-[28px] h-[28px] flex justify-center items-center rounded-sm cursor-pointer ${
                  _view?.key === store?.issue?.currentIssueBoardView
                    ? `bg-custom-background-200 text-custom-text-200`
                    : `hover:bg-custom-background-200 text-custom-text-300`
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
