import { Loader } from "@plane/ui";

export const PublishTemplateLoader = () => (
  <div className="flex flex-col gap-8 w-full mx-auto py-6">
    <div className="space-y-8">
      {/* Name */}
      <div className="space-y-2">
        <Loader.Item height="18px" width="120px" />
        <Loader.Item height="36px" />
      </div>

      {/* Short description */}
      <div className="space-y-2">
        <Loader.Item height="18px" width="120px" />
        <Loader.Item height="36px" />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Loader.Item height="18px" width="100px" />
        <Loader.Item height="108px" />
      </div>

      {/* Category and Keywords */}
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <Loader.Item height="18px" width="80px" />
          <Loader.Item height="36px" />
        </div>
        <div className="space-y-2">
          <Loader.Item height="18px" width="80px" />
          <Loader.Item height="36px" />
        </div>
      </div>

      {/* Company and Support Email */}
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <Loader.Item height="18px" width="120px" />
          <Loader.Item height="36px" />
        </div>
        <div className="space-y-2">
          <Loader.Item height="18px" width="120px" />
          <Loader.Item height="36px" />
        </div>
      </div>

      {/* Privacy Policy Link */}
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <Loader.Item height="18px" width="140px" />
          <Loader.Item height="18px" width="60px" />
        </div>
        <Loader.Item height="36px" />
      </div>

      {/* Terms of Use Link */}
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <Loader.Item height="18px" width="140px" />
          <Loader.Item height="18px" width="60px" />
        </div>
        <Loader.Item height="36px" />
      </div>

      {/* File Upload Section */}
      <div className="space-y-2">
        <Loader.Item height="18px" width="360px" />
        <Loader.Item height="108px" className="border-dashed border-2 border-custom-border-200 rounded-lg" />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-8 mt-8 border-t border-custom-border-200">
        <Loader.Item height="34px" width="80px" />
        <Loader.Item height="34px" width="120px" />
      </div>
    </div>
  </div>
);
