"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// components
import { QUICK_ACTION_MENU_ITEMS } from "@/components/cycles/quick-actions";

type TQuickActionsRoot = {
  cycleId: string;
};

export const QuickActionsRoot: FC<TQuickActionsRoot> = observer((props) => {
  const { cycleId } = props;

  return (
    <div>
      {QUICK_ACTION_MENU_ITEMS.map((item) => (
        <div key={item.title}>
          <item.component cycleId={cycleId} />
        </div>
      ))}
    </div>
  );
});
