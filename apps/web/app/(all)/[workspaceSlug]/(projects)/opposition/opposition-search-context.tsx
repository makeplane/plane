"use client";

import { createContext, useContext, useState } from "react";

interface SearchContextType {
  search: string;
  setSearch: (v: string) => void;
}

const OppositionSearchContext = createContext<SearchContextType | null>(null);

export const OppositionSearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [search, setSearch] = useState("");

  return (
    <OppositionSearchContext.Provider value={{ search, setSearch }}>
      {children}
    </OppositionSearchContext.Provider>
  );
};

export const useOppositionSearch = () => {
  const ctx = useContext(OppositionSearchContext);
  if (!ctx) throw new Error("useOppositionSearch must be used inside provider");
  return ctx;
};
