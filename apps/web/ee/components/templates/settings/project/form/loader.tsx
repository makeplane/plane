import { Loader } from "@plane/ui";

export const ProjectTemplateLoader = () => (
  <Loader className="flex flex-col items-center w-full h-full">
    <Loader className="space-y-4 w-full px-page-x py-page-y md:p-9">
      <Loader.Item height="40px" />
      <Loader.Item height="80px" />
    </Loader>
    <Loader className="bg-custom-background-90/80 flex flex-col items-center w-full h-full">
      <div className="w-full px-page-x py-page-y md:p-9">
        <div className="space-y-2">
          <Loader.Item height="140px" />
          <Loader className="flex flex-col gap-y-4 py-8 w-full">
            <Loader.Item height="40px" />
            <Loader.Item height="80px" />
          </Loader>
          <Loader className="flex flex-wrap items-center gap-2">
            <Loader.Item height="30px" width="100px" />
            <Loader.Item height="30px" width="100px" />
            <Loader.Item height="30px" width="100px" />
            <Loader.Item height="30px" width="100px" />
            <Loader.Item height="30px" width="140px" />
          </Loader>
          <Loader className="flex flex-col gap-y-6 py-6 w-full">
            <Loader.Item height="60px" />
            <Loader.Item height="60px" />
          </Loader>
        </div>
        <Loader className="flex items-center justify-end gap-2 pt-8 mt-8 border-t border-custom-border-200">
          <Loader.Item height="30px" width="100px" />
          <Loader.Item height="30px" width="100px" />
        </Loader>
      </div>
    </Loader>
  </Loader>
);
