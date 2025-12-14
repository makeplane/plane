import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
// types
import type { IBacklogItem } from "@plane/types";
// ui
import { Card } from "@plane/ui";
// hooks
import { useBacklog } from "@/hooks/store/backlog";
// components
import { CreateBacklogItemForm } from "./create-backlog-item-form";
import { DeleteBacklogItemModal } from "./delete-backlog-item-modal";

type Props = {
  item: IBacklogItem;
  familyId: string;
};

export const BacklogItemCard = observer(function BacklogItemCard(props: Props) {
  const { item, familyId } = props;
  const { deleteBacklogItem } = useBacklog();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (isEditing) {
    return (
      <CreateBacklogItemForm
        data={item}
        onClose={() => setIsEditing(false)}
        familyId={familyId}
      />
    );
  }

  const priorityColors: Record<number, string> = {
    5: "bg-red-500",
    4: "bg-orange-500",
    3: "bg-yellow-500",
    2: "bg-blue-500",
    1: "bg-green-500",
    0: "bg-gray-300",
  };

  const priorityColor = priorityColors[item.priority] || "bg-gray-300";

  return (
    <>
      <Card className="p-4 hover:bg-custom-background-90 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${priorityColor}`} />
              <h3 className="text-base font-medium text-custom-text-100 truncate">{item.title}</h3>
              {item.is_template && (
                <span className="px-2 py-0.5 text-xs bg-custom-background-80 text-custom-text-300 rounded">
                  Template
                </span>
              )}
            </div>
            {item.description && (
              <p className="text-sm text-custom-text-300 mb-2 line-clamp-2">{item.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-custom-text-400">
              <span className="px-2 py-1 bg-custom-background-80 rounded">{item.category}</span>
              {item.story_points && (
                <span>Effort: {item.story_points}/5</span>
              )}
              <span>Status: {item.status}</span>
              {item.creator_name && <span>Created by: {item.creator_name}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 hover:bg-custom-background-80 rounded transition-colors"
              aria-label="Edit backlog item"
            >
              <Pencil className="w-4 h-4 text-custom-text-400" />
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2 hover:bg-custom-background-80 rounded transition-colors"
              aria-label="Delete backlog item"
            >
              <Trash2 className="w-4 h-4 text-custom-text-400" />
            </button>
          </div>
        </div>
      </Card>
      <DeleteBacklogItemModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        item={item}
        familyId={familyId}
        onConfirm={async () => {
          await deleteBacklogItem(familyId, item.id);
          setIsDeleteModalOpen(false);
        }}
      />
    </>
  );
});

