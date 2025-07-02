export const WebhookSettingsLoader = () => (
  <div className="h-full w-full overflow-hidden py-8 pr-9">
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-custom-border-200 pb-3.5">
        <div className="text-xl font-medium">Webhooks</div>
        <span className="h-8 w-28 bg-custom-background-80 rounded" />
      </div>
      <div className="h-full w-full overflow-y-auto">
        <div className="border-b border-custom-border-200">
          <div>
            <span className="flex items-center justify-between gap-4 px-3.5 py-[18px]">
              <span className="h-5 w-36 bg-custom-background-80 rounded" />
              <span className="h-6 w-12 bg-custom-background-80 rounded" />
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
