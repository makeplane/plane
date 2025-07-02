import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { X } from "lucide-react";

export const RecentSearch = observer(() => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [visibleItems, setVisibleItems] = useState<number>(0);

  useEffect(() => {
    if (recentSearches.length > 0) {
      const timer = setInterval(() => {
        setVisibleItems((prev) => {
          if (prev < recentSearches.length) return prev + 1;
          clearInterval(timer);
          return prev;
        });
      }, 100);

      return () => clearInterval(timer);
    }
  }, [recentSearches]);

  return (
    <div className="w-full flex flex-col gap-2 py-6">
      {recentSearches.length > 0 && (
        <>
          <div className="flex justify-between text-custom-text-350">
            <div className="text-sm font-semibold">Recent Searches</div>
            <button className="underline text-xs font-medium">View all</button>
          </div>
          <div className="flex flex-col gap-1">
            {recentSearches.slice(0, visibleItems).map((search) => (
              <button
                className="group flex justify-between text-sm text-custom-text-100 transition-all duration-300 ease-in-out transform translate-y-0 py-2 rounded-md hover:bg-custom-background-90 hover:scale-[1.02] hover:px-1"
                key={search}
              >
                <span className="truncate ellipsis w-full group-hover:w-[95%] text-start">{search}</span>
                <X className="w-4 h-4 text-custom-text-400 my-auto opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
});
