export const CycleModuleBoardLayout = () => (
  <div className="h-full w-full animate-pulse">
    <div className="flex h-full w-full justify-between">
      <div className="grid h-full w-full grid-cols-1 gap-6 overflow-y-auto p-8 lg:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 auto-rows-max transition-all">
        {[...Array(5)].map((i) => (
          <div
            key={i}
            className="flex h-44 w-full flex-col justify-between rounded  border border-custom-border-100 bg-custom-background-100 p-4 text-sm"
          >
            <div className="flex items-center justify-between">
              <span className="h-6 w-24 bg-custom-background-80 rounded" />
              <div className="flex items-center gap-2">
                <span className="h-6 w-20 bg-custom-background-80 rounded" />
                <span className="h-6 w-6 bg-custom-background-80 rounded" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 bg-custom-background-80 rounded" />
                  <span className="h-5 w-20 bg-custom-background-80 rounded" />
                </div>
                <span className="h-5 w-5 bg-custom-background-80 rounded-full" />
              </div>
              <span className="h-1.5 bg-custom-background-80 rounded" />
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="h-4 w-16 bg-custom-background-80 rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 bg-custom-background-80 rounded" />
                  <span className="h-4 w-4 bg-custom-background-80 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
