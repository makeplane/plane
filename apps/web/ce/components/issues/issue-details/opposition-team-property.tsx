import { Ban } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";

interface Team {
  name: string;
  logo: string;
}

interface OppositionTeamPropertyProps {
  // onlyLogo?: boolean;
  value?: Team | null;
  onChange?: (team: Team | null) => void;
  disabled?: boolean;
  /** UNIQUE KEY FOR EACH CARD */
  storageKey: string;  
}

const OppositionTeamProperty: React.FC<OppositionTeamPropertyProps> = ({
  value = null,
  onChange,
  disabled = false,
  storageKey,
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // -----------------------------------------------
  // 1️⃣ Load saved team from localStorage (per card)
  // -----------------------------------------------
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: Team | null = JSON.parse(saved);
        setSelectedTeam(parsed);
        onChange?.(parsed);
      } catch {}
    } else {
      setSelectedTeam(value);
    }
  }, [storageKey]);

  // -----------------------------------------------
  // 2️⃣ Fetch teams
  // -----------------------------------------------
useEffect(() => {
  const API_URL = `${process.env.NEXT_PUBLIC_CP_SERVER_URL}/meta-type?key='OPPOSITIONTEAM'`;

  fetch(API_URL)
    .then((res) => res.json())
    .then((data) => {
      const values = data?.["Gateway Response"]?.result?.[0]?.[2]?.value || [];
      setTeams(values);
    })
    .catch((err) => console.error("Fetch Error:", err));
}, []);


  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // -----------------------------------------------
  // 3️⃣ When a team is selected → save to localStorage
  // -----------------------------------------------
  const handleSelect = (team: Team | null) => {
    setSelectedTeam(team);

    // Save per-card (unique) key
    localStorage.setItem(storageKey, JSON.stringify(team));

    onChange?.(team);
    setOpen(false);
    setSearch("");
  };

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-32" ref={dropdownRef}>
      <div
        onClick={() => !disabled && setOpen(!open)}
        className="rounded-lg px-2 py-1 flex items-center justify-between cursor-pointer text-[#737373] hover:bg-custom-background-80"
      >
        {selectedTeam ? (
          <div className="flex items-center gap-1.5">
            <img
              src={selectedTeam.logo}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="truncate text-xs">{selectedTeam.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Ban className="w-4 h-4" style={{ color: "#737373" }} />
            <span className="text-xs" style={{ color: "#737373" }}>
              Add opposition
            </span>
          </div>
        )}
      </div>
      {open && !disabled && (
        <div className="absolute mt-1 w-full bg-custom-border-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-50 text-[#737373]">
          <div className="p-2">
            <div className="flex items-center gap-2 bg-custom-border-200 rounded px-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full py-1 text-xs bg-custom-border-200 pl-2 focus:outline-none"
              />
            </div>
          </div>
          <div
            onClick={() => handleSelect(null)}
            className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-custom-background-80"
          >
            <Ban className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">None</span>
          </div>

          {filteredTeams.map((team, index) => (
            <div
              key={index}
              onClick={() => handleSelect(team)}
              className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-custom-background-80"
            >
              <img src={team.logo} className="w-5 h-5 rounded-full" />
              <span className="truncate text-xs">{team.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OppositionTeamProperty;
