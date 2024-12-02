import range from "lodash/range";

export const PagesLoader = () => (
  <div className="flex h-full flex-col space-y-5 overflow-hidden p-6">
    <div className="flex justify-between gap-4">
      <h3 className="text-2xl font-semibold text-custom-text-100">Pages</h3>
    </div>
    <div className="flex items-center gap-3">
      {range(5).map((i) => (
        <span key={i} className="h-8 w-20 bg-custom-background-80 rounded-full" />
      ))}
    </div>
    <div className="divide-y divide-custom-border-200">
      {range(5).map((i) => (
        <div key={i} className="h-12 w-full flex items-center justify-between px-3">
          <div className="flex items-center gap-1.5">
            <span className="h-5 w-5 bg-custom-background-80 rounded" />
            <span className="h-5 w-20 bg-custom-background-80 rounded" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-5 w-16 bg-custom-background-80 rounded" />
            <span className="h-5 w-5 bg-custom-background-80 rounded" />
            <span className="h-5 w-5 bg-custom-background-80 rounded" />
            <span className="h-5 w-5 bg-custom-background-80 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
