import React, { useEffect, useState, useRef } from "react";
import { Ban, CirclePlus, Search } from "lucide-react";
import { cn } from "@plane/utils";
import { normalizeOppositionTeam, TOppositionTeamOption } from "@/helpers/opposition-team";

type Team = TOppositionTeamOption;

interface OppositionTeamPropertyProps {
  value?: Team | null;
  onChange?: (team: Team | null) => void;
  disabled?: boolean;
  storageKey?: string;
}

const OppositionTeamProperty: React.FC<OppositionTeamPropertyProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Outside click handler (remains the same)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 3. Handling Select (Write Logic)
  const handleSelect = (team: Team | null) => {
    const normalizedTeam = normalizeOppositionTeam(team);
    onChange?.(normalizedTeam);
    setOpen(false);
    setSearch("");
  };

  const filteredTeams = teams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    // ... (rest of the component JSX remains the same) ...
    <div className="relative w-52" ref={dropdownRef}>
      <div
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          "rounded-lg px-2 py-1 flex items-center justify-between",
          value ? "text-custom-text-100" : "text-custom-text-300",
          disabled
            ? "cursor-default"
            : "cursor-pointer hover:bg-custom-background-80 hover:text-custom-text-100"
        )}
      >
        {value ? (
          <div className="flex items-center gap-1.5">
            {value.logo ? (
              <img
                src={`${process.env.NEXT_PUBLIC_CP_SERVER_URL}/blobs/${value.logo}`}
                alt={value.name}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : null}
            <span className="text-xs whitespace-normal">{value.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <CirclePlus className="w-4 h-4" />
            <span className="text-xs">Add Opposition Team</span>
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
            filteredTeams.map((team) => (
              <div
                key={team.name}
                onClick={() => handleSelect(team)}
                className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-custom-background-80"
              >
                {team.logo ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_CP_SERVER_URL}/blobs/${team.logo}`}
                    alt={team.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : null}
                <span className="text-xs whitespace-normal">{team.name}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default OppositionTeamProperty;
