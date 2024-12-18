export const TeamsLoader = () => (
  <div className="h-full overflow-y-auto animate-pulse">
    <div className="flex h-full w-full justify-between">
      <div className="flex h-full w-full flex-col overflow-y-auto">
        {[...Array(5)].map((i) => (
          <div
            key={i}
            className="flex w-full items-center justify-between gap-5 border-b border-custom-border-100 flex-col sm:flex-row px-7 py-4"
          >
            <div className="relative flex w-full items-center gap-3 justify-between overflow-hidden">
              <div className="relative w-full flex items-center gap-3 overflow-hidden">
                <div className="flex items-center gap-4 truncate">
                  <span className="size-7 bg-custom-background-80 rounded-md" />
                  <span className="h-5 w-20 bg-custom-background-80 rounded" />
                </div>
              </div>
              <span className="size-7 bg-custom-background-80 rounded-full" />
            </div>
            <div className="flex w-full sm:w-auto relative overflow-hidden items-center gap-2.5 justify-between sm:justify-end sm:flex-shrink-0 ">
              <div className="flex-shrink-0 relative flex items-center gap-3">
                <span className="h-7 w-20 bg-custom-background-80 rounded-full" />
                <span className="h-6 w-6 bg-custom-background-80 rounded" />
                <span className="h-3 w-6 bg-custom-background-80 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
