import { useState } from "react";
import { observer } from "mobx-react";
import { Search, X } from "lucide-react";
// ui
import { TSearchResultItem } from "@plane/constants";
import { Input } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// plane web imports
import { SearchResults } from "@/plane-web/components/workspace/search";

export const AppSearchRoot = observer(() => {
  // use state
  const [searchQuery, setSearchQuery] = useState("");
  const [flattenedSearchResults, setFlattenedSearchResults] = useState<TSearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  return (
    <div
      className={cn(
        "h-full w-full flex flex-col items-center",
        "transition-all duration-500 ease-out",
        "px-4 sm:px-6 pt-4"
      )}
    >
      <h3
        className={cn(
          "font-semibold text-custom-text-100",
          "transform transition-all duration-500 ease-out",
          "opacity-0 scale-95 text-sm h-8"
        )}
      >
        Your workspace at your fingertips
      </h3>
      <div className={cn("w-full relative transition-all duration-500 ease-out h-full", "max-w-full", "py-2 sm:px-2")}>
        <div className="relative flex items-center group">
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              e.target.value && setIsSearching(true);
            }}
            className={cn(
              "shadow-sm px-10 w-full rounded-lg border-custom-border-200 bg-custom-background-100 ring-0 transition-all duration-200 focus:ring-2 focus:ring-custom-primary/30 focus:border-custom-primary placeholder:text-custom-text-400 h-10"
            )}
            placeholder="Search everything in your workspace"
            autoFocus
          />
          <div className="absolute left-2.5">
            <Search
              className={cn(
                "transition-colors duration-200",
                "text-custom-text-400 group-hover:text-custom-text-300",
                "w-4 h-4"
              )}
            />
          </div>
          {searchQuery && (
            <div className="absolute right-2.5">
              <X
                className="w-4 h-4 text-custom-text-400 hover:text-custom-text-100 cursor-pointer transition-colors duration-200"
                onClick={() => {
                  setSearchQuery("");
                  setFlattenedSearchResults([]);
                }}
              />
            </div>
          )}
        </div>

        <SearchResults
          query={searchQuery}
          flattenedSearchResults={flattenedSearchResults}
          setFlattenedSearchResults={setFlattenedSearchResults}
          isSearching={isSearching}
          setIsSearching={setIsSearching}
        />
      </div>
    </div>
  );
});
