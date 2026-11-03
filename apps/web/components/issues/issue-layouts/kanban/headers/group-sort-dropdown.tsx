
import React, { useState } from "react";
import { ArrowUp, ArrowDown, ChevronDown } from "lucide-react";

type SortOption = "priority" | "start_date" | "target_date";
type SortDirection = "asc" | "desc";

interface GroupSortDropdownProps {
    onSortChange: (option: SortOption, direction: SortDirection) => void;
}

const options: { label: string; value: SortOption }[] = [
    { label: "Priority", value: "priority" },
    { label: "Start Date", value: "start_date" },
    { label: "Due Date", value: "target_date" },
];

const GroupSortDropdown = ({ onSortChange }: GroupSortDropdownProps) => {
    const [sortBy, setSortBy] = useState<SortOption>("priority");
    const [direction, setDirection] = useState<SortDirection>("asc");
    const [isOpen, setIsOpen] = useState(false);

    const handleSortChange = (value: SortOption) => {
        console.log("DROPDOWN OPTION:", value);
        setSortBy(value);
        onSortChange(value, direction);
        setIsOpen(false);
    };

    const toggleDirection = () => {
        const newDirection = direction === "asc" ? "desc" : "asc";
        setDirection(newDirection);
        console.log("DROPDOWN DIRECTION:", newDirection);
        onSortChange(sortBy, newDirection);
    };

    return (
        <div className="relative flex items-center gap-1">
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex items-center gap-1 rounded border px-2 py-1 text-sm"
            >
                {options.find((option) => option.value === sortBy)?.label}
                <ChevronDown size={14} />
            </button>

            <button
                type="button"
                onClick={toggleDirection}
                title={direction === "asc" ? "Ascending" : "Descending"}
                className="rounded border p-1"
            >
                {direction === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full z-[100] mt-1 min-w-36 rounded border bg-white shadow-lg">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSortChange(option.value)}
                            className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-100"
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GroupSortDropdown;
