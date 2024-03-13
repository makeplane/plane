import { FC, useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Search } from "lucide-react";
// hooks
import { useProjectPages } from "hooks/store";
import useDebounce from "hooks/use-debounce";

export type TPageSearchInput = { projectId: string };

export const PageSearchInput: FC<TPageSearchInput> = observer((props) => {
  const { projectId } = props;
  // hooks
  const {
    filters: { search },
    updateFilters,
  } = useProjectPages(projectId);
  // states
  const [searchElement, setSearchElement] = useState(search);
  // debounce state
  const debouncedValue = useDebounce(searchElement, 1000);

  useEffect(() => {
    if (debouncedValue !== search) updateFilters("search", debouncedValue);

    // DO NOT Add more dependencies here. It will cause multiple requests to be sent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  return (
    <div className="inline-block">
      <div className="relative inline-flex items-center gap-1.5 border border-custom-border-300 rounded overflow-hidden p-1.5 px-2 min-w-[280px] max-w-[400px]">
        <div className="flex-shrink-0 w-4 h-4 overflow-hidden relative flex justify-center items-center">
          <Search className="w-3.5 h-3.5" />
        </div>
        <input
          type="text"
          value={searchElement}
          placeholder="Search pages"
          onChange={(e) => setSearchElement(e.target.value)}
          className="w-full text-sm bg-transparent focus:outline-none focus:ring-0 focus:border-0 border-0"
        />
      </div>

      {/* Gonna implement dropdown in future */}
    </div>
  );
});
