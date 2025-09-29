import { range } from "lodash-es";

export const ProjectTeamspaceListLoader = () => (
  <div className="divide-y-[0.5px] divide-custom-border-100">
    {range(3).map((i) => (
      <div key={i} className="group grid grid-cols-3 items-center justify-between px-3 py-4">
        <div className="flex items-center gap-x-4">
          <span className="size-7 bg-custom-background-80 rounded-md" />
          <span className="h-5 w-24 bg-custom-background-80 rounded" />
        </div>
        <div className="flex -space-x-2">
          {range(3).map((j) => (
            <span key={j} className="size-7 bg-custom-background-80 rounded-full ring-2 ring-custom-background-100" />
          ))}
        </div>
        <span className="h-5 w-20 bg-custom-background-80 rounded" />
      </div>
    ))}
  </div>
);
