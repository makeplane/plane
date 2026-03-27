import { Link, useSearchParams } from "react-router";
import { cn } from "@plane/utils";

const HO_VIEW_TABS = [
  { key: "department", label: "Department" },
  { key: "datasheet", label: "Datasheet" },
  { key: "category", label: "Category" },
] as const;

type THoViewKey = (typeof HO_VIEW_TABS)[number]["key"];

export const HoViewTabs = function HoViewTabs() {
  const [searchParams] = useSearchParams();
  const activeView = (searchParams.get("view") as THoViewKey) ?? "department";

  return (
    <div className="flex items-center gap-1 border-b border-subtle bg-surface-1 px-page-x">
      {HO_VIEW_TABS.map((tab) => (
        <Link
          key={tab.key}
          to={`?view=${tab.key}`}
          className={cn(
            "px-4 py-2.5 text-13 font-medium border-b-2 -mb-[1px] transition-colors whitespace-nowrap",
            activeView === tab.key
              ? "border-accent-primary text-accent-primary"
              : "border-transparent text-secondary hover:text-primary"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
};
