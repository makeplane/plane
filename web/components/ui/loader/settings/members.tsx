export const MembersSettingsLoader = () => (
  <div className="divide-y-[0.5px] divide-custom-border-100 animate-pulse">
    {[...Array(4)].map((i) => (
      <div key={i} className="group flex items-center justify-between px-3 py-4">
        <div className="flex items-center gap-x-4 gap-y-2">
          <span className="h-10 w-10 bg-custom-background-80 rounded-full" />
          <div className="flex flex-col gap-1">
            <span className="h-5 w-20 bg-custom-background-80 rounded" />
            <span className="h-4 w-36 bg-custom-background-80 rounded" />
          </div>
        </div>
        <span className="h-6 w-16 bg-custom-background-80 rounded" />
      </div>
    ))}
  </div>
);
