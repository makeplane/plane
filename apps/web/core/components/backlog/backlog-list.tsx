import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
// types
import type { IBacklogItem } from "@plane/types";
// hooks
import { useBacklog } from "@/hooks/store/backlog";
// components
import { BacklogItemCard } from "./backlog-item-card";
import { CategoryFilter } from "./category-filter";

type Props = {
  familyId: string;
};

export const BacklogList = observer(function BacklogList(props: Props) {
  const { familyId } = props;
  const { fetchBacklogItems, getBacklogItemsByFamily, loader, reorderBacklogItems } = useBacklog();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (familyId) {
      fetchBacklogItems(familyId, {
        category: selectedCategory || undefined,
        status: selectedStatus || undefined,
      });
    }
  }, [familyId, selectedCategory, selectedStatus, fetchBacklogItems]);

  const backlogItems = getBacklogItemsByFamily(familyId);
  const sortedItems = [...backlogItems].sort((a, b) => {
    // Sort by priority (higher first), then by created_at (newer first)
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleDragStart = (itemId: string) => {
    setDraggedItemId(itemId);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedItemId) return;

    const draggedIndex = sortedItems.findIndex((item) => item.id === draggedItemId);
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedItemId(null);
      setDragOverIndex(null);
      return;
    }

    // Create new order array
    const newOrder = [...sortedItems];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);

    // Extract item IDs in new order
    const itemIds = newOrder.map((item) => item.id);

    try {
      await reorderBacklogItems(familyId, { item_ids: itemIds });
    } catch (error) {
      console.error("Failed to reorder backlog items", error);
    } finally {
      setDraggedItemId(null);
      setDragOverIndex(null);
    }
  };

  if (loader && backlogItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-custom-text-300">Loading backlog items...</div>
      </div>
    );
  }

  if (sortedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-sm text-custom-text-300 mb-2">No backlog items found</div>
        <div className="text-xs text-custom-text-400">Create your first backlog item to get started</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <CategoryFilter
        familyId={familyId}
        selectedCategory={selectedCategory}
        selectedStatus={selectedStatus}
        onCategoryChange={setSelectedCategory}
        onStatusChange={setSelectedStatus}
      />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {sortedItems.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(item.id)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={`transition-all ${
                draggedItemId === item.id ? "opacity-50" : ""
              } ${
                dragOverIndex === index ? "border-t-2 border-blue-500" : ""
              }`}
            >
              <BacklogItemCard item={item} familyId={familyId} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

