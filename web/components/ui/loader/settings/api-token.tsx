export const APITokenSettingsLoader = () => (
  <section className="w-full overflow-y-auto py-8 pr-9">
    <div className="mb-2 flex items-center justify-between border-b border-custom-border-200 py-3.5">
      <h3 className="text-xl font-medium">API tokens</h3>
      <span className="h-8 w-28 bg-custom-background-80 rounded" />
    </div>
    <div className="divide-y-[0.5px] divide-custom-border-200">
      {[...Array(2)].map((i) => (
        <div key={i} className="flex flex-col gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-5 w-28 bg-custom-background-80 rounded" />
            <span className="h-5 w-16 bg-custom-background-80 rounded" />
          </div>
          <span className="h-5 w-36 bg-custom-background-80 rounded" />
        </div>
      ))}
    </div>
  </section>
);
