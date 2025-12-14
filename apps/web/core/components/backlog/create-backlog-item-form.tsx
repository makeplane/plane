import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { X } from "lucide-react";
// types
import type { IBacklogItem, IBacklogItemFormData } from "@plane/types";
// ui
import { Button } from "@plane/propel/button";
import { Input, TextArea, Card } from "@plane/ui";
// hooks
import { useBacklog } from "@/hooks/store/backlog";
// services
import { FamilyMemberService, FamilyService } from "@plane/services";

type Props = {
  familyId: string;
  data?: IBacklogItem;
  onClose: () => void;
};

export function CreateBacklogItemForm(props: Props) {
  const { familyId, data, onClose } = props;
  const { createBacklogItem, updateBacklogItem, fetchBacklogItems } = useBacklog();
  const [currentMember, setCurrentMember] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const isEditMode = !!data;

  useEffect(() => {
    const fetchFamily = async () => {
      try {
        const familyService = new FamilyService();
        const family = await familyService.getFamily(familyId);
        const categories = family.all_swim_lanes || family.default_swim_lanes || [];
        setAvailableCategories(categories);
      } catch (error) {
        console.error("Failed to fetch family", error);
      }
    };
    fetchFamily();
  }, [familyId]);

  useEffect(() => {
    // Get current user's family member ID
    const fetchCurrentMember = async () => {
      try {
        const memberService = new FamilyMemberService();
        const members = await memberService.getMembers(familyId);
        // In a real app, you'd get the current user's member from context
        // For now, we'll use the first member or the creator
        if (members.length > 0) {
          setCurrentMember(members[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch family members", error);
      }
    };
    fetchCurrentMember();
  }, [familyId]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IBacklogItemFormData>({
    defaultValues: {
      family: familyId,
      title: data?.title || "",
      description: data?.description || "",
      category: data?.category || availableCategories[0] || "",
      priority: data?.priority ?? 0,
      story_points: data?.story_points || null,
      status: data?.status || "backlog",
      is_template: data?.is_template || false,
      creator: currentMember || data?.creator || "",
    },
  });

  const onSubmit = async (formData: IBacklogItemFormData) => {
    if (!currentMember && !data?.creator) {
      alert("Unable to determine creator. Please refresh and try again.");
      return;
    }

    try {
      if (isEditMode && data) {
        await updateBacklogItem(familyId, data.id, {
          ...formData,
          creator: data.creator,
        });
      } else {
        await createBacklogItem(familyId, {
          ...formData,
          creator: currentMember || "",
        });
      }
      await fetchBacklogItems(familyId);
      onClose();
    } catch (error) {
      console.error("Failed to save backlog item", error);
      alert("Failed to save backlog item. Please try again.");
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {isEditMode ? "Edit" : "Create"} Backlog Item
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-custom-background-80 rounded transition-colors"
          aria-label="Close form"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-custom-text-300 mb-1">
            Title *
          </label>
          <Controller
            control={control}
            name="title"
            rules={{ required: "Title is required" }}
            render={({ field }) => (
              <Input
                {...field}
                hasError={!!errors.title}
                placeholder="Enter backlog item title"
                className="w-full"
              />
            )}
          />
          {errors.title && (
            <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-custom-text-300 mb-1">
            Description
          </label>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <TextArea
                {...field}
                placeholder="Enter description (optional)"
                rows={3}
                className="w-full"
              />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-custom-text-300 mb-1">
            Category *
          </label>
          <Controller
            control={control}
            name="category"
            rules={{ required: "Category is required" }}
            render={({ field }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-custom-border-300 rounded-md bg-custom-background-100 text-custom-text-100"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.category && (
            <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-custom-text-300 mb-1">
              Priority
            </label>
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  min="0"
                  placeholder="0"
                  className="w-full"
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-custom-text-300 mb-1">
              Effort Points (1-5)
            </label>
            <Controller
              control={control}
              name="story_points"
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  min="1"
                  max="5"
                  placeholder="Optional"
                  className="w-full"
                  onChange={(e) =>
                    field.onChange(e.target.value ? parseInt(e.target.value) : null)
                  }
                />
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="is_template"
            render={({ field }) => (
              <input
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                className="rounded"
              />
            )}
          />
          <label className="text-sm text-custom-text-300">Save as template</label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEditMode ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

