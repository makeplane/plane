export const ImportExportSettingsLoader = () => (
  <div className="divide-y-[0.5px] divide-custom-border-200 animate-pulse">
    {[...Array(2)].map((i) => (
      <div key={i} className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="h-5 w-16 bg-custom-background-80 rounded" />
            <span className="h-5 w-16 bg-custom-background-80 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-28 bg-custom-background-80 rounded" />
            <span className="h-4 w-28 bg-custom-background-80 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);
