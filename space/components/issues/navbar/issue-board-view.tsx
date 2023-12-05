import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// constants
import { issueViews } from "constants/data";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
import { TIssueBoardKeys } from "types/issue";

export const NavbarIssueBoardView = observer(() => {
  const {
    project: { viewOptions, setActiveBoard, activeBoard },
  }: RootStore = useMobxStore();
  // router
  const router = useRouter();
  const { workspace_slug, project_slug } = router.query as { workspace_slug: string; project_slug: string };

  const handleCurrentBoardView = (boardView: string) => {
    setActiveBoard(boardView as TIssueBoardKeys);
    router.push(`/${workspace_slug}/${project_slug}?board=${boardView}`);
  };

  return (
    <>
      {viewOptions &&
        Object.keys(viewOptions).map((viewKey: string) => {
          if (viewOptions[viewKey]) {
            return (
              <div
                key={viewKey}
                className={`flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-sm ${
                  viewKey === activeBoard
                    ? `bg-custom-background-80 text-custom-text-200`
                    : `text-custom-text-300 hover:bg-custom-background-80`
                }`}
                onClick={() => handleCurrentBoardView(viewKey)}
                title={viewKey}
              >
                <span
                  className={`material-symbols-rounded text-[18px] ${
                    issueViews[viewKey]?.className ? issueViews[viewKey]?.className : ``
                  }`}
                >
                  {issueViews[viewKey]?.icon}
                </span>
              </div>
            );
          }
        })}
    </>
  );
});
