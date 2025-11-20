"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { loadOppositionTeams } from "../(opposition-api)/loadOppositionTeams";

interface Team {
  name: string;
  address: string;
  logo: string;
  athletic_email: string;
  athletic_phone: string;
  head_coach_name: string;
  asst_coach_name: string;
  asst_athletic_email: string;
  asst_athletic_phone: string;
}

interface OppositionContextType {
  teams: Team[];
  loading: boolean;
  refreshTeams: () => Promise<void>;
}

const OppositionTeamsContext = createContext<OppositionContextType | null>(null);

export const OppositionTeamsProvider = ({ children }: { children: React.ReactNode }) => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshTeams = async () => {
    setLoading(true);
    try {
      const data = await loadOppositionTeams();
      setTeams(data);
    } catch (err) {
      console.error("Failed to refresh opposition teams:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshTeams();
  }, []);

  return (
    <OppositionTeamsContext.Provider value={{ teams, loading, refreshTeams }}>
      {children}
    </OppositionTeamsContext.Provider>
  );
};

export const useOppositionTeams = () => {
  const context = useContext(OppositionTeamsContext);

  if (!context) {
    throw new Error("useOppositionTeams must be used inside OppositionTeamsProvider");
  }

  return context;
};
