import React from "react";
import { Disclosure } from "@headlessui/react";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// components
import { IssueListView } from "./list";
import { IssueListGroupHeader } from "./group-header";

export const IssueListViewRoot = observer(() => {
  const { issueView: issueViewStore, issueFilters: issueFilterStore }: RootStore = useMobxStore();
  console.log("issueViewStore", issueViewStore);
  console.log("userFilters", issueFilterStore.userFilters);
  console.log("issueFilterStore", issueFilterStore);

  return (
    <div className="relative w-full h-full">
      {issueViewStore.loader || issueViewStore?.getIssues === null ? (
        <div>Loading...</div>
      ) : (
        <>
          {Object.keys(issueViewStore?.getIssues).map((groupId) => (
            <Disclosure key={groupId}>
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex w-full justify-between rounded-lg bg-purple-100 px-4 py-2 text-left text-sm font-medium text-purple-900 hover:bg-purple-200 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75">
                    <IssueListGroupHeader
                      groupId={groupId}
                      groupBy={issueFilterStore.userFilters?.display_filters["group_by"] || ""}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-4 pt-4 pb-2">
                    <IssueListView issues={issueViewStore?.getIssues?.[groupId]} groupId={groupId} />
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          ))}
        </>
      )}
    </div>
  );
});
