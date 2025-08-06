"use client";

import React, { useCallback } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PlaneLockup } from "@plane/ui";
// hooks
import { useUser } from "@/hooks/store";
// services
import { AuthenticationWrapper } from "@/lib/wrappers";
// local imports
import { ESupportedFeatures, WorkspaceSelector } from "./workspace-selector";

const NOT_FOUND_CLASSNAME = "flex items-center justify-center h-full text-custom-text-100 text-lg font-medium";

const WorkspacePickerPage = observer(() => {
  // router
  const { feature: featureFromRoute, identifier } = useParams();
  const feature = featureFromRoute as ESupportedFeatures;
  // hooks
  const { data: currentUser } = useUser();
  // derived values
  const isFeatureSupported = Object.values(ESupportedFeatures).includes(feature);

  const renderContent = useCallback(() => {
    if (!isFeatureSupported) {
      return <div className={NOT_FOUND_CLASSNAME}>Invalid feature</div>;
    }
    if (typeof identifier !== "string") {
      return <div className={NOT_FOUND_CLASSNAME}>Invalid identifier</div>;
    }
    return <WorkspaceSelector feature={feature} identifier={identifier} />;
  }, [feature, identifier, isFeatureSupported]);

  return (
    <AuthenticationWrapper>
      <div className="flex flex-col h-full gap-y-2 pb-20">
        <div className="flex items-center justify-between p-10 lg:px-20 xl:px-36">
          <Link href="/" className="bg-custom-background-100 px-3">
            <PlaneLockup className="h-7 w-auto text-custom-text-100" />
          </Link>
          <div className="text-sm text-custom-text-100">{currentUser?.email}</div>
        </div>
        {renderContent()}
      </div>
    </AuthenticationWrapper>
  );
});

export default WorkspacePickerPage;
