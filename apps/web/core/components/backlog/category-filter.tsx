import { useState, useEffect } from "react";
import { Filter } from "lucide-react";
// services
import { FamilyService } from "@plane/services";

type Props = {
  familyId: string;
  selectedCategory: string | null;
  selectedStatus: string | null;
  onCategoryChange: (category: string | null) => void;
  onStatusChange: (status: string | null) => void;
};

export function CategoryFilter(props: Props) {
  const { familyId, selectedCategory, selectedStatus, onCategoryChange, onStatusChange } = props;
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchFamily = async () => {
      try {
        const familyService = new FamilyService();
        const family = await familyService.getFamily(familyId);
        const cats = family.all_swim_lanes || family.default_swim_lanes || [];
        setCategories(cats);
      } catch (error) {
        console.error("Failed to fetch family", error);
      }
    };
    fetchFamily();
  }, [familyId]);

  const statusOptions = [
    { value: null, label: "All Statuses" },
    { value: "backlog", label: "Backlog" },
    { value: "sprint", label: "Sprint" },
    { value: "archived", label: "Archived" },
  ];

  return (
    <div className="flex items-center gap-4 p-4 bg-custom-background-90 border-b border-custom-border-200">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-custom-text-400" />
        <span className="text-sm font-medium text-custom-text-300">Filters:</span>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-custom-text-400">Category:</label>
        <select
          value={selectedCategory || ""}
          onChange={(e) => onCategoryChange(e.target.value || null)}
          className="px-3 py-1.5 text-sm border border-custom-border-300 rounded-md bg-custom-background-100 text-custom-text-100"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-custom-text-400">Status:</label>
        <select
          value={selectedStatus || ""}
          onChange={(e) => onStatusChange(e.target.value || null)}
          className="px-3 py-1.5 text-sm border border-custom-border-300 rounded-md bg-custom-background-100 text-custom-text-100"
        >
          {statusOptions.map((option) => (
            <option key={option.value || "all"} value={option.value || ""}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {(selectedCategory || selectedStatus) && (
        <button
          onClick={() => {
            onCategoryChange(null);
            onStatusChange(null);
          }}
          className="text-sm text-custom-text-400 hover:text-custom-text-300 underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

