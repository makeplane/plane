"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// ui
import { useParams } from "next/navigation";
import { Button, getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web components
// import { PaidPlanUpgradeModal } from "@/plane-web/components/license";

export const WorkspacePagesUpgrade: FC = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // states
  const [isPaidPlanModalOpen, togglePaidPlanModal] = useState(false);

  return (
    <>
      {/* <PaidPlanUpgradeModal isOpen={isPaidPlanModalOpen} handleClose={() => togglePaidPlanModal(false)} /> */}
      <div className="relative flex h-screen w-full items-center justify-center overflow-hidden">
        <div className="text-center px-4">
          <h3 className="text-2xl font-medium mb-4">Workspace Pages are on our Pro plan.</h3>
          <p className="text-lg">Unlock public pages, version history, shared pages, real-time collaboration,</p>
          <p>and workspace pages for wikis, company-wide docs, and knowledge bases with Plane Pro.</p>
          <div className="flex items-center justify-center gap-2 py-6">
            <Link
              href={`/${workspaceSlug?.toString()}`}
              className={cn("w-fit whitespace-nowrap", getButtonStyling("neutral-primary", "md"))}
            >
              Go Home
            </Link>
            <Button onClick={() => togglePaidPlanModal(true)}>Upgrade</Button>
          </div>
        </div>
      </div>
    </>
  );
});
