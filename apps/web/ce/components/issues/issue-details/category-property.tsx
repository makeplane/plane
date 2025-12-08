import React, { useEffect, useState, useRef } from "react";
import { Ban, CirclePlus, Search } from "lucide-react";

interface CategoryPropertyProps {
  value?: string | null;
  onChange?: (category: string | null) => void;
  disabled?: boolean;
  storageKey: string;
}

const TEMP_STORAGE_KEY = "category-temp-create";

const determineStorageKey = (key: string): { actualKey: string; isCreating: boolean } => {
  const isCreating = key.includes("undefined");
  return { actualKey: isCreating ? TEMP_STORAGE_KEY : key, isCreating };
};

const CategoryProperty: React.FC<CategoryPropertyProps> = ({
  value,
  onChange,
  disabled = false,
  storageKey,
}) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { actualKey, isCreating } = determineStorageKey(storageKey);

  // Load from localStorage
  useEffect(() => {
    if (value === undefined || value === null) {
      try {
        const saved = localStorage.getItem(actualKey);
        if (saved) onChange?.(JSON.parse(saved));
      } catch {}
    }
  }, [actualKey, value, onChange]);

  // Move temp to real key
  useEffect(() => {
    if (!isCreating && actualKey !== TEMP_STORAGE_KEY) {
      try {
        const temp = localStorage.getItem(TEMP_STORAGE_KEY);
        if (temp) localStorage.setItem(actualKey, temp);
        localStorage.removeItem(TEMP_STORAGE_KEY);
      } catch {}
    }
  }, [isCreating, actualKey]);

  // Fetch categories
  useEffect(() => {
    const API_URL = `${process.env.NEXT_PUBLIC_CP_SERVER_URL}/meta-type?key='CATEGORY'`;
    setLoading(true);

    fetch(API_URL)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        const responseBlock = data?.["Gateway Response"]?.result?.[0] ?? [];
        const values = responseBlock.find((i: any) => i?.field === "values")?.value;
        if (!Array.isArray(values)) throw new Error("Invalid response");

        setCategories(values.sort());
      })
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Outside click to close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (category: string | null) => {
    try {
      if (category) localStorage.setItem(actualKey, JSON.stringify(category));
      else localStorage.removeItem(actualKey);
    } catch {}

    onChange?.(category);
    setOpen(false);
    setSearch("");
  };

  const filteredCategories = categories.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-52" ref={dropdownRef}>
      <div
        onClick={() => !disabled && setOpen((o) => !o)}
        className="rounded-lg px-2 py-1 flex items-center gap-1.5 cursor-pointer text-custom-text-300 hover:bg-custom-background-80 hover:text-custom-text-100"
      >
        {value ? (
          <span className="text-xs">{value}</span>
        ) : (
          <div className="flex items-center gap-1.5">
            <CirclePlus className="w-4 h-4" />
            <span className="text-xs">Add Category</span>
          </div>
        )}
      </div>

      {open && !disabled && (
        <div className="absolute mt-1 w-full rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 shadow-lg max-h-40 overflow-y-auto z-50 text-[#737373]">
          <div className="relative p-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full py-1 pl-8 pr-2 text-xs rounded bg-custom-background-90 focus:outline-none"
            />
          </div>

          <div
            onClick={() => handleSelect(null)}
            className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-custom-background-80"
          >
            <Ban className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">None</span>
          </div>

          {loading && <div className="px-2 py-1 text-xs">Loading…</div>}
          {loadError && <div className="px-2 py-1 text-xs text-red-500">Failed to load</div>}

          {!loading &&
            !loadError &&
            filteredCategories.map((category) => (
              <div
                key={category}
                onClick={() => handleSelect(category)}
                className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-custom-background-80"
              >
                <span className="text-xs whitespace-normal">{category}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default CategoryProperty;
