import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useParams } from "react-router";
import { Plus } from "lucide-react";
// components
import { PageHead } from "@/components/core/page-title";
import { BacklogList } from "@/components/backlog/backlog-list";
import { CreateBacklogItemForm } from "@/components/backlog/create-backlog-item-form";
// ui
import { Button } from "@plane/propel/button";

function BacklogPage() {
  const { familyId } = useParams();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  if (!familyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-custom-text-300">Family ID is required</div>
      </div>
    );
  }

  return (
    <>
      <PageHead title="Family Backlog - To-Do List" />
      <div className="h-full w-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-custom-border-200">
          <div>
            <h1 className="text-2xl font-semibold text-custom-text-100">Family Backlog</h1>
            <p className="text-sm text-custom-text-400 mt-1">
              Manage your family's tasks, chores, and goals
            </p>
          </div>
          <Button
            onClick={() => setIsCreateFormOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Item
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          {isCreateFormOpen ? (
            <div className="p-4">
              <CreateBacklogItemForm
                familyId={familyId}
                onClose={() => setIsCreateFormOpen(false)}
              />
            </div>
          ) : (
            <BacklogList familyId={familyId} />
          )}
        </div>
      </div>
    </>
  );
}

export default observer(BacklogPage);

