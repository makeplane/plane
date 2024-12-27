import Link from "next/link";
import { ChevronRight } from "lucide-react";
// types
import { TPropertyListItem } from "./root";

export const TeamsPropertiesList = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col pt-3 pb-1 px-0.5 gap-x-2 gap-y-2">{children}</div>
);

export const TeamsPropertiesListItem = (props: Omit<TPropertyListItem, "key">) => {
  const { label, icon: Icon, value, href } = props;
  return (
    <div className="grid grid-cols-2 items-center py-1">
      <div className="flex items-center gap-x-2">
        <Icon className="size-4 text-custom-text-300" />
        <span className="text-sm text-custom-text-200">{label}</span>
      </div>
      {href ? (
        <Link
          href={href}
          className="group flex py-1 px-1 gap-2 items-center justify-between hover:bg-custom-background-90 rounded cursor-pointer transition-all"
        >
          <span className="text-sm text-custom-text-200">{value}</span>
          <ChevronRight className="size-3 text-custom-text-400 group-hover:text-custom-text-200" />
        </Link>
      ) : (
        <span className="py-1 px-1 text-sm text-custom-text-200">{value}</span>
      )}
    </div>
  );
};

TeamsPropertiesList.Item = TeamsPropertiesListItem;
