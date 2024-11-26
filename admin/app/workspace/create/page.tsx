"use client";

import { observer } from "mobx-react";
// components
import { WorkspaceCreateForm } from "./form";

const WorkspaceCreatePage = observer(() => (
  <div className="relative container mx-auto w-full h-full p-4 py-4 space-y-6 flex flex-col">
    <div className="border-b border-custom-border-100 mx-4 py-4 space-y-1 flex-shrink-0">
      <div className="text-xl font-medium text-custom-text-100">Create workspace</div>
      <div className="text-sm font-normal text-custom-text-300">Create a new workspace for your team.</div>
    </div>
    <div className="flex-grow overflow-hidden overflow-y-scroll vertical-scrollbar scrollbar-md px-4">
      <WorkspaceCreateForm />
    </div>
  </div>
));

export default WorkspaceCreatePage;
