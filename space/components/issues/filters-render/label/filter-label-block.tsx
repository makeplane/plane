import { useRouter } from "next/router";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
// interfaces
import { IIssueLabel } from "types/issue";

export const RenderIssueLabel = observer(({ label }: { label: IIssueLabel }) => {
  const store = useMobxStore();

  const router = useRouter();
  const { workspace_slug, project_slug } = router.query as { workspace_slug: string; project_slug: string };

  const removeLabelFromFilter = () => {
    // router.replace(
    //   store.issue.getURLDefinition(workspace_slug, project_slug, {
    //     key: "label",
    //     value: label?.id,
    //   })
    // );
  };

  return (
    <div
      className="flex-shrink-0 relative flex items-center flex-wrap gap-1 px-2 py-0.5 rounded-full select-none"
      style={{ color: label?.color, backgroundColor: `${label?.color}10` }}
    >
      <div
        className="flex-shrink-0 w-1.5 h-1.5 flex justify-center items-center overflow-hidden rounded-full"
        style={{ backgroundColor: `${label?.color}` }}
      />

      <div className="font-medium whitespace-nowrap text-xs">{label?.name}</div>
      <div
        className="flex-shrink-0 w-3 h-3 cursor-pointer flex justify-center items-center overflow-hidden rounded-full"
        onClick={removeLabelFromFilter}
      >
        <span className="material-symbols-rounded text-xs">close</span>
      </div>
    </div>
  );
});
