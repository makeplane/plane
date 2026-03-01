/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { lazy, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// constants
import { CYCLE_ACTION } from "@/constants/cycle";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
// plane web imports
import { useFlag } from "@/plane-web/hooks/store";

const StartCycleModal = lazy(() => import("./modal").then((module) => ({ default: module.StartCycleModal })));

type Props = {
  cycleId: string;
  projectId: string;
};

export const StartCycleButton = observer(function StartCycleButton(props: Props) {
  //props
  const { projectId, cycleId } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [startCycleModalOpen, setStartCycleModal] = useState(false);
  const [startingCycle, setStartingCycle] = useState(false);
  // store hooks
  const { isNextCycle, updateCycleStatus } = useCycle();
  const isEndCycleEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.CYCLE_PROGRESS_CHARTS);

  const handleStartCycle = async () => {
    setStartingCycle(true);
    try {
      await updateCycleStatus(workspaceSlug.toString(), projectId, cycleId, CYCLE_ACTION.START);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Cycle started successfully",
      });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        message: error?.error || "Failed to start cycle",
        title: "Error",
      });
    } finally {
      setStartCycleModal(false);
      setStartingCycle(false);
    }
  };

  if (!isNextCycle(projectId, cycleId) || !isEndCycleEnabled) return <></>;
  return (
    <>
      <StartCycleModal
        handleClose={() => setStartCycleModal(false)}
        isOpen={startCycleModalOpen}
        handleStartCycle={handleStartCycle}
        loading={startingCycle}
      />
      <button
        className="rounded-md px-2 h-6 bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/10 hover:text-accent-secondary focus:bg-accent-primary/10"
        onClick={() => setStartCycleModal(true)}
      >
        Start cycle
      </button>
    </>
  );
});
