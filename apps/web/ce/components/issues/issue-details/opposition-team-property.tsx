import { Ban, CirclePlus } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";

interface Team {
  name: string;
  logo: string;
}

interface OppositionTeamPropertyProps {
  value?: Team | null;
  onChange?: (team: Team | null) => void;
  disabled?: boolean;
  storageKey: string;
}

const OppositionTeamProperty: React.FC<OppositionTeamPropertyProps> = ({
  value = null,
  onChange,
  disabled = false,
  storageKey,
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(value);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // sync latest prop into component state
  useEffect(() => {
    setSelectedTeam(value);
  }, [value]);

  // load saved local preference only as UI fallback (no onChange trigger)
  useEffect(() => {
    try {
      if (!value) {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved) as Team | null;
          setSelectedTeam(parsed);
        }
      }
    } catch (e) {
      console.warn("LocalStorage read failed", e);
    }
  }, [storageKey, value]);

  // fetch teams
  useEffect(() => {
    const API_URL = `${process.env.NEXT_PUBLIC_CP_SERVER_URL}/meta-type?key='OPPOSITIONTEAM'`;
    setLoading(true);

    fetch(API_URL)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        const items = data?.["Gateway Response"]?.result?.[0] ?? [];
        const values = items.find((i: any) => i?.field === "values")?.value;

        if (!Array.isArray(values)) throw new Error("Invalid structure");

        setTeams(values.sort((a: Team, b: Team) => a.name.localeCompare(b.name)));
      })
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (team: Team | null) => {
    setSelectedTeam(team);

    try {
      if (team) localStorage.setItem(storageKey, JSON.stringify(team));
      else localStorage.removeItem(storageKey);
    } catch {}

    // only emit user-triggered change
    onChange?.(team);
    setOpen(false);
    setSearch("");
  };

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-52" ref={dropdownRef}>
      <div
        onClick={() => !disabled && setOpen((o) => !o)}
        className="rounded-lg px-2 py-1 flex items-center justify-between cursor-pointer text-[#737373] hover:bg-custom-background-80"
      >
        {selectedTeam ? (
          <div className="flex items-center gap-1.5">
            <img
              src={selectedTeam.logo}
              alt={`${selectedTeam.name} logo`}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-xs whitespace-normal">{selectedTeam.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <CirclePlus className="w-4 h-4" />
            <span className="text-xs">Add Opposition Team</span>
          </div>
        )}
      </div>

      {open && !disabled && (
        <div className="absolute mt-1 w-full bg-custom-border-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-50 text-[#737373]">
          <div className="p-2 flex items-center gap-2 bg-custom-border-200">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full py-1 text-xs bg-custom-border-200 pl-2 focus:outline-none"
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
          {!loading && !loadError && filteredTeams.map((team) => (
            <div
              key={team.name}
              onClick={() => handleSelect(team)}
              className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-custom-background-80"
            >
              <img
                src={team.logo}
                alt={`${team.name} logo`}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="text-xs whitespace-normal">{team.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OppositionTeamProperty;
