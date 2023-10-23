import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { ChevronDown } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// components
import { Dropdown } from "components/ui/dropdown";
// constants
import { issueGroupFilter } from "constants/data";

const PRIORITIES = ["urgent", "high", "medium", "low"];

export const NavbarIssueFilter = observer(() => {
  const store: RootStore = useMobxStore();

  const router = useRouter();
  const pathName = router.asPath;

  const handleOnSelect = (key: "states" | "labels" | "priorities", value: string) => {
    // if (key === "states") {
    //   store.issue.userSelectedStates = store.issue.userSelectedStates.includes(value)
    //     ? store.issue.userSelectedStates.filter((s) => s !== value)
    //     : [...store.issue.userSelectedStates, value];
    // } else if (key === "labels") {
    //   store.issue.userSelectedLabels = store.issue.userSelectedLabels.includes(value)
    //     ? store.issue.userSelectedLabels.filter((l) => l !== value)
    //     : [...store.issue.userSelectedLabels, value];
    // } else if (key === "priorities") {
    //   store.issue.userSelectedPriorities = store.issue.userSelectedPriorities.includes(value)
    //     ? store.issue.userSelectedPriorities.filter((p) => p !== value)
    //     : [...store.issue.userSelectedPriorities, value];
    // }
    // const paramsCommaSeparated = `${`board=${store.issue.currentIssueBoardView || "list"}`}${
    //   store.issue.userSelectedPriorities.length > 0 ? `&priorities=${store.issue.userSelectedPriorities.join(",")}` : ""
    // }${store.issue.userSelectedStates.length > 0 ? `&states=${store.issue.userSelectedStates.join(",")}` : ""}${
    //   store.issue.userSelectedLabels.length > 0 ? `&labels=${store.issue.userSelectedLabels.join(",")}` : ""
    // }`;
    // router.replace(`${pathName}?${paramsCommaSeparated}`);
  };

  return (
    <Dropdown
      button={
        <>
          <span>Filters</span>
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        </>
      }
      items={[
        {
          display: "Priority",
          children: PRIORITIES.map((priority) => ({
            display: (
              <span className="capitalize flex items-center gap-x-2">
                <span className="material-symbols-rounded text-[14px]">
                  {priority === "urgent"
                    ? "error"
                    : priority === "high"
                    ? "signal_cellular_alt"
                    : priority === "medium"
                    ? "signal_cellular_alt_2_bar"
                    : "signal_cellular_alt_1_bar"}
                </span>
                {priority}
              </span>
            ),
            onClick: () => handleOnSelect("priorities", priority),
            isSelected: store.issue.filteredPriorities.includes(priority),
          })),
        },
        {
          display: "State",
          children: (store.issue.states || []).map((state) => {
            const stateGroup = issueGroupFilter(state.group);

            return {
              display: (
                <span className="capitalize flex items-center gap-x-2">
                  {stateGroup && <stateGroup.icon />}
                  {state.name}
                </span>
              ),
              onClick: () => handleOnSelect("states", state.id),
              isSelected: store.issue.filteredStates.includes(state.id),
            };
          }),
        },
        {
          display: "Labels",
          children: [...(store.issue.labels || [])].map((label) => ({
            display: (
              <span className="capitalize flex items-center gap-x-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: label.color || "#000",
                  }}
                />
                {label.name}
              </span>
            ),
            onClick: () => handleOnSelect("labels", label.id),
            isSelected: store.issue.filteredLabels.includes(label.id),
          })),
        },
      ]}
    />
  );
});
