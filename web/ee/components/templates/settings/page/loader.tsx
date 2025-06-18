import { Loader } from "@plane/ui";

export const PageTemplateLoader = () => (
  <Loader className="flex flex-col items-center w-full h-full mt-4">
    <Loader className="space-y-4 w-full">
      <Loader.Item height="40px" />
      <Loader.Item height="80px" />
    </Loader>
    <Loader className="flex flex-col items-center w-full h-full">
      <div className="w-full">
        <div className="space-y-2">
          <Loader className="flex flex-col gap-y-4 py-4 w-full">
            <Loader.Item height="40px" />
            <Loader.Item height="120px" />
          </Loader>
        </div>
        <div className="flex items-center justify-end gap-2 pt-8 mt-8 border-t border-custom-border-200">
          <Loader className="flex items-center justify-end gap-x-2">
            <Loader.Item height="30px" width="100px" />
            <Loader.Item height="30px" width="100px" />
          </Loader>
        </div>
      </div>
    </Loader>
  </Loader>
);
