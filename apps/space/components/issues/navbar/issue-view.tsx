"use client";

// mobx react lite
import { observer } from "mobx-react-lite";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";

export const NavbarIssueView = observer(() => {
  const store: any = useMobxStore();

  return <div>View</div>;
});
