export const EmailSettingsLoader = () => (
  <div className="mx-auto mt-8 h-full w-full overflow-y-auto px-6 lg:px-20 pb- animate-pulse">
    <div className="flex flex-col gap-2 pt-6 mb-2 pb-6 border-b border-custom-border-100">
      <span className="h-7 w-40 bg-custom-background-80 rounded" />
      <span className="h-5 w-96 bg-custom-background-80 rounded" />
    </div>
    <div className="flex flex-col gap-2">
      <div className="flex items-center py-3">
        <span className="h-7 w-32 bg-custom-background-80 rounded" />
      </div>
      {[...Array(4)].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex flex-col gap-2 py-3">
            <span className="h-6 w-28 bg-custom-background-80 rounded" />
            <span className="h-5 w-96 bg-custom-background-80 rounded" />
          </div>
          <div className="flex items-center">
            <span className="h-5 w-5 bg-custom-background-80 rounded" />
          </div>
        </div>
      ))}
      <div className="flex items-center py-12">
        <span className="h-8 w-32 bg-custom-background-80 rounded" />
      </div>
    </div>
  </div>
);
