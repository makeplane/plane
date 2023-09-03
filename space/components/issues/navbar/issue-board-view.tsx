import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// constants
import { issueViews } from "constants/data";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const NavbarIssueBoardView = observer(() => {
  const { project: projectStore, issue: issueStore }: RootStore = useMobxStore();

  const router = useRouter();
  const { workspace_slug, project_slug } = router.query as { workspace_slug: string; project_slug: string };

  const handleCurrentBoardView = (boardView: string) => {
    projectStore.setActiveBoard(boardView);
    router.push(
      `/${workspace_slug}/${project_slug}?board=${boardView}${
        issueStore?.filteredLabels && issueStore?.filteredLabels.length > 0
          ? `&labels=${issueStore?.filteredLabels.join(",")}`
          : ""
      }${
        issueStore?.filteredPriorities && issueStore?.filteredPriorities.length > 0
          ? `&priorities=${issueStore?.filteredPriorities.join(",")}`
          : ""
      }${
        issueStore?.filteredStates && issueStore?.filteredStates.length > 0
          ? `&states=${issueStore?.filteredStates.join(",")}`
          : ""
      }`
    );
  };

  return (
    <>
      {projectStore?.viewOptions &&
        Object.keys(projectStore?.viewOptions).map((viewKey: string) => {
          if (projectStore?.viewOptions[viewKey]) {
            return (
              <div
                key={viewKey}
                className={`w-[28px] h-[28px] flex justify-center items-center rounded-sm cursor-pointer ${
                  viewKey === projectStore?.activeBoard
                    ? `bg-custom-background-80 text-custom-text-200`
                    : `hover:bg-custom-background-80 text-custom-text-300`
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
