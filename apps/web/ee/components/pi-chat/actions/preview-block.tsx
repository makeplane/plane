import Link from "next/link";
import { ArrowUpRight, Briefcase, FileText, Layers } from "lucide-react";
import { DiceIcon, LayersIcon, ContrastIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
import { TArtifact } from "@/plane-web/types";

export const getIcon = (type: string, color?: string, defaultRender: "text" | "icon" = "icon") => {
  switch (type) {
    case "project":
      return <Briefcase width={16} height={16} />;
    case "workitem":
      return <LayersIcon width={16} height={16} />;
    case "page":
      return <FileText width={16} height={16} />;
    case "cycle":
      return <ContrastIcon width={16} height={16} />;
    case "module":
      return <DiceIcon width={16} height={16} />;
    case "view":
      return <Layers width={16} height={16} />;
    default:
      return defaultRender === "icon" ? (
        <div
          className={cn("size-3 rounded", { "bg-custom-background-80": !color })}
          style={{ backgroundColor: color }}
        />
      ) : (
        <div className="bg-custom-background-90 rounded-full py-0.5 px-2 capitalize text-xs text-custom-text-200 font-medium">
          {type}
        </div>
      );
  }
};
export const PreviewBlock = (props: { type: string; name: string; url?: string | null; data?: TArtifact }) => {
  const { type, name, url, data } = props;
  return (
    <Link
      target="_blank"
      href={url || ""}
      className="group flex flex-col items-start gap-2 p-3 rounded-xl bg-custom-background-100 border-[0.5px] border-custom-border-200 hover:shadow-sm overflow-hidden text-custom-text-200"
    >
      <div className="flex items-center gap-2 justify-between w-full">
        <div className="flex gap-2 items-center">
          <div>{getIcon(type, "", "text")}</div>
          {(type === "workitem" || type === "project") && data && (
            <div className="text-sm font-medium text-custom-text-350">
              {(data as TArtifact).issue_identifier ||
                (data as TArtifact).project_identifier ||
                (data as TArtifact).parameters?.project?.identifier}
            </div>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 size-4 bg-custom-background-90 rounded-full flex items-center justify-center p-0.5">
          <ArrowUpRight className="" strokeWidth={2.5} />
        </div>
      </div>
      <div className="text-sm font-medium line-clamp-2 text-start">{name}</div>
    </Link>
  );
};
