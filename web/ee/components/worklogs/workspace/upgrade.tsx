"use client";

import { FC, Fragment, useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Button } from "@plane/ui";
// plane web components
import { ProPlanCloudUpgradeModal } from "@/plane-web/components/license";

export const WorkspaceWorklogsUpgrade: FC = observer(() => {
  const { resolvedTheme } = useTheme();
  // states
  const [isPaidPlanModalOpen, togglePaidPlanModal] = useState(false);

  // derived values
  const resolvedEmptyStatePath = `/empty-state/worklogs/worklog-${resolvedTheme === "light" ? "light" : "dark"}.png`;

  return (
    <Fragment>
      <ProPlanCloudUpgradeModal isOpen={isPaidPlanModalOpen} handleClose={() => togglePaidPlanModal(false)} />
      <div className="flex flex-col gap-5 items-center justify-center min-h-full min-w-full overflow-y-auto py-10 md:px-20 px-5">
        <div className="flex flex-col gap-1.5 flex-shrink">
          <h3 className="text-xl font-semibold">Get detailed time-tracking reports from your workspace</h3>
          <p className="text-sm">
            Set date ranges for logged time by any member in any project in your workspace and get full CSVs in a click.
          </p>
        </div>
        <Image
          src={resolvedEmptyStatePath}
          alt={"Worklog empty state"}
          width={384}
          height={250}
          layout="responsive"
          lazyBoundary="100%"
        />
        <Button onClick={() => togglePaidPlanModal(true)}>Upgrade</Button>
      </div>
    </Fragment>
  );
});
