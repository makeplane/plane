"use client";

// mobx react lite
import { observer } from "mobx-react-lite";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";

export const NavbarIssueFilter = observer(() => {
  const store: any = useMobxStore();

  return <div>Filter</div>;
});
