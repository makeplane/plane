import { useRouter } from "next/router";
// mobx react lite
import { observer } from "mobx-react-lite";
// components
import { RenderIssueLabel } from "./filter-label-block";
// interfaces
import { IIssueLabel } from "types/issue";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const IssueLabelFilter = observer(() => {
  const store: RootStore = useMobxStore();

  const router = useRouter();
  const { workspace_slug, project_slug } = router.query as { workspace_slug: string; project_slug: string };

  const clearLabelFilters = () => {
    // router.replace(
    //   store.issue.getURLDefinition(workspace_slug, project_slug, {
    //     key: "label",
    //     removeAll: true,
    //   })
    // );
  };

  return (
    <>
      <div className="flex items-center gap-2 border border-custom-border-300 px-2 py-1 rounded-full text-xs">
        <div className="flex-shrink-0 text-custom-text-200">Labels</div>
        <div className="relative flex flex-wrap items-center gap-1">
          {/* {store?.issue?.labels &&
            store?.issue?.labels.map(
              (_label: IIssueLabel, _index: number) =>
                store.issue.getUserSelectedFilter("label", _label.id) && (
                  <RenderIssueLabel key={_label.id} label={_label} />
                )
            )} */}
        </div>
        <div
          className="flex-shrink-0 w-3 h-3 cursor-pointer flex justify-center items-center overflow-hidden rounded-sm"
          onClick={clearLabelFilters}
        >
          <span className="material-symbols-rounded text-[12px]">close</span>
        </div>
      </div>
    </>
  );
});

export default IssueLabelFilter;
