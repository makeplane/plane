"use client";

import React from "react";
import { Combobox } from "@headlessui/react";
import { Search, ChevronDown, Check } from "lucide-react";
import { usePopper } from "react-popper";
import { cn } from "@plane/utils";
import { useOutsideClickDetector } from "@plane/hooks";
import { RepositoryService } from "@/services/qa";

type TRepository = { id: string; name: string; description?: string | null };

type RepositorySelectProps = {
  workspaceSlug: string;
  projectId?: string;
  className?: string;
  defaultRepositoryId?: string | null;
  onRepositoryChange?: (repository: { id: string | null; name?: string | null }) => void;
};

export const RepositorySelect: React.FC<RepositorySelectProps> = ({
  workspaceSlug,
  projectId,
  className,
  defaultRepositoryId = null,
  onRepositoryChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [repositories, setRepositories] = React.useState<TRepository[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(defaultRepositoryId);

  React.useEffect(() => {
    setSelectedId(defaultRepositoryId);
  }, [defaultRepositoryId]);

  const [referenceElement, setReferenceElement] = React.useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = React.useState<HTMLDivElement | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, { placement: "bottom-start" });
  useOutsideClickDetector(dropdownRef, () => setIsOpen(false));

  const fetchRepositories = React.useCallback(
    async (nameQuery?: string) => {
      setIsLoading(true);
      try {
        const service = new RepositoryService();
        const params: any = nameQuery ? { name: nameQuery } : {};
        if (projectId) params.project_id = projectId;
        const resp = await service.getRepositories(workspaceSlug, params);
        const list: TRepository[] =
          resp?.data?.map((r: any) => ({ id: r.id, name: r.name, description: r.description })) ?? [];
        setRepositories(list);
      } catch (e) {
      } finally {
        setIsLoading(false);
      }
    },
    [workspaceSlug, projectId]
  );

  React.useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);
  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (query.trim()) fetchRepositories(query.trim());
      else fetchRepositories();
    }, 250);
    return () => clearTimeout(handler);
  }, [query, fetchRepositories]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return repositories;
    const q = query.toLowerCase();
    return repositories.filter((r) => r.name.toLowerCase().includes(q));
  }, [repositories, query]);

  const selectedName = selectedId
    ? (repositories.find((r) => r.id === selectedId)?.name ?? "已选择的测试库")
    : "全部测试库";
  const onChange = (val: string | null) => {
    setSelectedId(val);
    const selectedRepo = val ? repositories.find((r) => r.id === val) : null;
    onRepositoryChange?.({ id: val, name: selectedRepo?.name ?? null });
    setIsOpen(false);
  };

  return (
    <Combobox as="div" ref={dropdownRef} value={selectedId} onChange={onChange} className={cn("relative", className)}>
      <Combobox.Button as={React.Fragment}>
        <button
          ref={setReferenceElement}
          type="button"
          className={cn(
            "flex items-center gap-1 rounded border-[0.5px] border-custom-border-300 px-2 py-1 text-xs hover:bg-custom-background-80"
          )}
          onClick={() => setIsOpen((p) => !p)}
        >
          <span className="truncate max-w-[160px]">{selectedName}</span>
          <ChevronDown className="h-3 w-3 flex-shrink-0" />
        </button>
      </Combobox.Button>

      {isOpen && (
        <Combobox.Options className="fixed z-10" static>
          <div
            className="my-1 min-w-56 rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="flex items-center gap-1.5 rounded border border-custom-border-100 bg-custom-background-90 px-2">
              <Search className="h-3.5 w-3.5 text-custom-text-400" strokeWidth={1.5} />
              <Combobox.Input
                as="input"
                className="w-full bg-transparent py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="按名称搜索"
              />
            </div>

            <div className="mt-2 max-h-48 overflow-y-scroll space-y-1">
              <Combobox.Option
                key="__all__"
                value={null}
                className={({ active, selected }) =>
                  cn(
                    "flex w-full cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5",
                    active && "bg-custom-background-80",
                    selected ? "text-custom-text-100" : "text-custom-text-200"
                  )
                }
              >
                {({ selected }) => (
                  <>
                    <span className="flex-grow truncate">全部测试库</span>
                    {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                  </>
                )}
              </Combobox.Option>

              {isLoading ? (
                <div className="flex items-center justify-center py-2">
                  <div className="w-4 h-4 border-2 border-custom-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length > 0 ? (
                filtered.map((repo) => (
                  <Combobox.Option
                    key={repo.id}
                    value={repo.id}
                    className={({ active, selected }) =>
                      cn(
                        "flex w-full cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5",
                        active && "bg-custom-background-80",
                        selected ? "text-custom-text-100" : "text-custom-text-200"
                      )
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className="flex-grow truncate">{repo.name}</span>
                        {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                      </>
                    )}
                  </Combobox.Option>
                ))
              ) : (
                <p className="text-custom-text-400 italic py-1 px-1.5">没有匹配项</p>
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </Combobox>
  );
};
