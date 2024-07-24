"use client";

import { FC, Fragment, useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Button } from "@plane/ui";
// plane web components
import { CloudProductsModal } from "@/plane-web/components/license";

export const WorkspaceWorklogsUpgrade: FC = observer(() => {
  const { resolvedTheme } = useTheme();
  // states
  const [isProPlanModalOpen, toggleProPlanModal] = useState(false);

  // derived values
  const resolvedEmptyStatePath = `/empty-state/worklogs/worklog-${resolvedTheme === "light" ? "light" : "dark"}.png`;

  return (
    <Fragment>
      <CloudProductsModal isOpen={isProPlanModalOpen} handleClose={() => toggleProPlanModal(false)} />
      <div className="flex flex-col gap-5 items-center justify-center min-h-full min-w-full overflow-y-auto py-10 md:px-20 px-5">
        <div className="flex flex-col gap-1.5 flex-shrink">
          <h3 className="text-xl font-semibold">Unlock worklogs with Plane pro</h3>
          <p className="text-sm">
            Issue types distinguish different kinds of work in unique ways, helping you to identify, categorize, and
            report on your team’s work more effectively.
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
        <Button onClick={() => toggleProPlanModal(true)}>Upgrade</Button>
      </div>
    </Fragment>
  );
});
