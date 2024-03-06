export const ProjectsLoader = () => (
  <div className="h-full w-full overflow-y-auto p-8 animate-pulse">
    <div className="grid grid-cols-1 gap-9 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((i) => (
        <div
          key={i}
          className="flex cursor-pointer flex-col rounded border border-custom-border-200 bg-custom-background-100"
        >
          <div className="relative min-h-[118px] w-full rounded-t border-b border-custom-border-200 ">
            <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/20 to-transparent">
              <div className="absolute bottom-4 z-10 flex h-10 w-full items-center justify-between gap-3 px-4">
                <div className="flex flex-grow items-center gap-2.5 truncate">
                  <span className="min-h-9 min-w-9 bg-custom-background-80 rounded" />
                  <div className="flex w-full flex-col justify-between gap-0.5 truncate">
                    <span className="h-4 w-28 bg-custom-background-80 rounded" />
                    <span className="h-4 w-16 bg-custom-background-80 rounded" />
                  </div>
                </div>
                <div className="flex h-full flex-shrink-0 items-center gap-2">
                  <span className="h-6 w-6 bg-custom-background-80 rounded" />
                  <span className="h-6 w-6 bg-custom-background-80 rounded" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex h-[104px] w-full flex-col justify-between rounded-b p-4">
            <span className="h-4 w-36 bg-custom-background-80 rounded" />
            <div className="item-center flex justify-between">
              <span className="h-5 w-20 bg-custom-background-80 rounded" />
              <span className="h-5 w-5 bg-custom-background-80 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
