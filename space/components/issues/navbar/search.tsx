"use client";

// mobx react lite
import { observer } from "mobx-react-lite";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const NavbarSearch = observer(() => {
  const store: RootStore = useMobxStore();

  return <div> </div>;
});
