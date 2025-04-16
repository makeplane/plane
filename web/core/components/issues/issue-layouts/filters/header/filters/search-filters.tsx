"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useDebounce from "@/hooks/use-debounce";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { Search } from "lucide-react";

type Props = {
	propertyKey: string;
	handleSectionSearch: (groupKey: string, query: string) => void;
};

export const FilterSearch: React.FC<Props> = observer(({ propertyKey, handleSectionSearch }) => {
	const { isMobile } = usePlatformOS();
	const [filtersSearchQuery, setFiltersSearchQuery] = useState("");
	const debouncedSearchQuery = useDebounce(filtersSearchQuery, 500);


	useEffect(() => {
		handleSectionSearch(propertyKey, debouncedSearchQuery);
	}, [debouncedSearchQuery]);

	return (
		<div className="bg-custom-background-100 py-2 sticky top-[1em]">
			<div className="flex items-center gap-1.5 rounded border-[0.5px] border-custom-border-200 bg-custom-background-90 px-1.5 py-1 text-xs">
				<Search className="text-custom-text-400" size={12} strokeWidth={2} />
				<input
					type="text"
					className="w-full bg-custom-background-90 outline-none placeholder:text-custom-text-400"
					placeholder="Search"
					value={filtersSearchQuery}
					onChange={(e) => setFiltersSearchQuery(e.target.value)}
					autoFocus={!isMobile}
				/>
			</div>
		</div>
	);
});
