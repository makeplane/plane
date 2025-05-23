import { Loader } from "@plane/ui";

export const PageTemplateLoader = () => (
  <Loader className="flex flex-col items-center w-full h-full">
    <Loader className="space-y-4 w-full max-w-4xl px-page-x py-page-y md:p-9">
      <Loader.Item height="40px" />
      <Loader.Item height="80px" />
    </Loader>
    <Loader className="bg-custom-background-90/80 flex flex-col items-center w-full h-full">
      <div className="w-full max-w-4xl px-page-x py-page-y md:p-9">
        <div className="space-y-2">
          <Loader className="flex flex-col gap-y-4 py-4 w-full">
            <Loader.Item height="40px" />
            <Loader.Item height="120px" />
          </Loader>
        </div>
        <div className="flex items-center justify-between gap-2 pt-8 mt-8 border-t border-custom-border-200">
          <Loader.Item height="30px" width="140px" />
          <Loader className="flex items-center justify-end gap-x-2">
            <Loader.Item height="30px" width="100px" />
            <Loader.Item height="30px" width="100px" />
          </Loader>
        </div>
      </div>
    </Loader>
  </Loader>
);
