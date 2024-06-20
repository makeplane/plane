export const IntegrationsSettingsLoader = () => (
  <div className="divide-y-[0.5px] divide-custom-border-100 animate-pulse">
    {[...Array(2)].map((i) => (
      <div
        key={i}
        className="flex items-center justify-between gap-2 border-b border-custom-border-100 bg-custom-background-100 px-4 py-6"
      >
        <div className="flex items-start gap-4">
          <span className="h-10 w-10 bg-custom-background-80 rounded-full" />
          <div className="flex flex-col gap-1">
            <span className="h-5 w-20 bg-custom-background-80 rounded" />
            <span className="h-4 w-60 bg-custom-background-80 rounded" />
          </div>
        </div>
        <span className="h-8 w-16 bg-custom-background-80 rounded" />
      </div>
    ))}
  </div>
);
