import range from "lodash/range";

export const MembersSettingsLoader = () => (
  <div className="divide-y-[0.5px] divide-custom-border-100">
    {range(3).map((i) => (
      <div key={i} className="group grid grid-cols-5 items-center justify-evenly px-3 py-4">
        <div className="flex col-span-2 items-center gap-x-2.5">
          <span className="size-6 bg-custom-background-80 rounded-full" />
          <span className="h-5 w-24 bg-custom-background-80 rounded" />
        </div>
        <span className="h-5 w-24 bg-custom-background-80 rounded" />
        <span className="h-5 w-20 bg-custom-background-80 rounded" />
        <span className="h-5 w-28 bg-custom-background-80 rounded" />
      </div>
    ))}
  </div>
);
