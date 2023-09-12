import React from "react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const DisplayPropertiesSelection = () => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore, issueView: issueStore } = store;

  return (
    <div>
      <div>Filter Selection</div>
    </div>
  );
};
