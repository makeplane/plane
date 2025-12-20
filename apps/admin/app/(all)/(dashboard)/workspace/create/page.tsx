import { observer } from "mobx-react";
// components
import type { Route } from "./+types/page";
import { WorkspaceCreateForm } from "./form";

const WorkspaceCreatePage = observer(function WorkspaceCreatePage(_props: Route.ComponentProps) {
  return (
    <div className="relative container mx-auto w-full h-full p-4 py-4 space-y-6 flex flex-col">
      <div className="border-b border-subtle mx-4 py-4 space-y-1 flex-shrink-0">
        <div className="text-18 font-medium text-primary">Create a new workspace on this instance.</div>
        <div className="text-13 font-regular text-tertiary">
          You will need to invite users from Workspace Settings after you create this workspace.
        </div>
      </div>
      <div className="flex-grow overflow-hidden overflow-y-scroll vertical-scrollbar scrollbar-md px-4">
        <WorkspaceCreateForm />
      </div>
    </div>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Create Workspace - God Mode" }];

export default WorkspaceCreatePage;
