"use client";

import React, { useEffect, useState, useRef } from "react";
import { Ban, CirclePlus, Search } from "lucide-react";

interface YearRangePropertyProps {
  value?: string | null;
  onChange?: (yearRange: string | null) => void;
  disabled?: boolean;
  storageKey: string;
  startYear?: number; // Optional start year
}

const TEMP_STORAGE_KEY = "year-range-temp-create";

const determineStorageKey = (key: string): { actualKey: string; isCreating: boolean } => {
  const isCreating = key.includes("undefined");
  return { actualKey: isCreating ? TEMP_STORAGE_KEY : key, isCreating };
};

const YearRangeProperty: React.FC<YearRangePropertyProps> = ({
  value,
  onChange,
  disabled = false,
  storageKey,
  startYear = 2020
}) => {
  const generateYearSessions = (startYear: number): string[] => {
    const currentYear = new Date().getFullYear();
    const sessions: string[] = [];
    for (let year = currentYear; year >= startYear; year--) {
      sessions.push(`${year}-${year + 1}`);
    }
    return sessions;
  };

  const yearRanges = generateYearSessions(startYear);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { actualKey, isCreating } = determineStorageKey(storageKey);

  useEffect(() => {
    if (value === undefined || value === null) {
      const saved = localStorage.getItem(actualKey);
      if (saved) onChange?.(JSON.parse(saved));
    }
  }, [actualKey, value, onChange]);

  useEffect(() => {
    if (!isCreating && actualKey !== TEMP_STORAGE_KEY) {
      const tmp = localStorage.getItem(TEMP_STORAGE_KEY);
      if (tmp) localStorage.setItem(actualKey, tmp);
      localStorage.removeItem(TEMP_STORAGE_KEY);
    }
  }, [isCreating, actualKey]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (range: string | null) => {
    if (range) localStorage.setItem(actualKey, JSON.stringify(range));
    else localStorage.removeItem(actualKey);

    onChange?.(range);
    setOpen(false);
    setSearch("");
  };

  const filteredRanges = yearRanges.filter((y) =>
    y.toLowerCase().includes(search.toLowerCase())
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
            <span className="text-xs">Add Year</span>
          </div>
        )}
      </div>

      {open && !disabled && (
        <div className="absolute mt-1 w-full rounded border border-custom-border-300 bg-custom-background-100 shadow-lg max-h-40 overflow-y-auto z-50">
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

          {filteredRanges.map((range) => (
            <div
              key={range}
              onClick={() => handleSelect(range)}
              className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-custom-background-80"
            >
              <span className="text-xs">{range}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default YearRangeProperty;
