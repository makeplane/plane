import React from "react";
import { NextPage } from "next";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { ModulesListView } from "components/modules";
import { ModulesListHeader } from "components/headers";

const ProjectModules: NextPage = () => (
  <AppLayout header={<ModulesListHeader />} withProjectWrapper>
    <ModulesListView />
  </AppLayout>
);

export default ProjectModules;
