"use client";

import { observer } from "mobx-react";
import { PageHead } from "@/components/core/page-title";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web components
import { InitiativesPageRoot } from "@/plane-web/components/initiatives/layout/page";

const InitiativesPage = observer(() => {
  // store hooks
  const { currentWorkspace } = useWorkspace();

  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Initiatives` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <InitiativesPageRoot />
    </>
  );
});
export default InitiativesPage;
