import React from "react";
// components
import { IssueKanBanViewRoot } from "components/issue-layouts/kanban";
import { LayoutSelection } from "components/issue-layouts/layout-selection";
// issue dropdowns
import { IssueDropdown } from "components/issue-layouts/helpers/dropdown";
// filter components
import { FilterSelection } from "components/issue-layouts/filters";
import { DisplayFiltersSelection } from "components/issue-layouts/display-filters";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const KanBanViewRoot = () => {
  const workspaceSlug: string = "plane-demo";
  const projectSlug: string = "08d59d96-9dfb-40e5-aa30-ecc66319450f";
  const moduleSlug: string = "05613afc-29ea-4fd8-a025-a3cdfed209d1";
  const cycleSlug: string = "1f66a767-00d1-422c-8f8f-6925282b7249";
  const viewSlug: string = "64e6ecca-80ca-4f7c-8476-d650fca9d5b9";

  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore, issueView: issueViewStore } = store;

  React.useEffect(() => {
    const init = async () => {
      console.log("started--->");
      // my issues under a workspace
      // await issueViewStore.getMyIssuesAsync(workspaceSlug);

      // project issues under and workspace and project
      await issueViewStore.getProjectIssuesAsync(workspaceSlug, projectSlug);

      // module issues under and workspace and project
      // await issueViewStore.getIssuesForModulesAsync(workspaceSlug, projectSlug, moduleSlug);

      // cycle issues under and workspace and project
      // await issueViewStore.getIssuesForCyclesAsync(workspaceSlug, projectSlug, cycleSlug);

      // cycle issues under and workspace and project
      // await issueViewStore.getIssuesForViewsAsync(workspaceSlug, projectSlug, viewSlug);
      console.log("ended--->");
    };

    init();
  }, []);

  return (
    <div className="w-screen min-h-[600px] h-screen">
      <div className="w-full h-full relative flex flex-col overflow-hidden">
        <div className="flex-shrink-0 h-[60px] border-b border-gray-200">
          <div className="w-full h-full p-2 px-5 relative flex justify-between items-center gap-2">
            <div>
              <div>Filter Header</div>
            </div>
            <div className="relative flex items-center gap-2">
              <IssueDropdown title={"Filters"}>
                <FilterSelection />
              </IssueDropdown>
              <IssueDropdown title={"View"}>
                <DisplayFiltersSelection />
              </IssueDropdown>
              <LayoutSelection />
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 border-b border-gray-200">Hello</div>
        <div className="w-full h-full relative overflow-hidden">
          <IssueKanBanViewRoot />
        </div>
      </div>
    </div>
  );
};

export default KanBanViewRoot;
