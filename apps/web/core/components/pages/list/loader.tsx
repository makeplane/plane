import { Loader } from "@plane/ui";

export function PageListLoader() {
  return (
    <Loader className="relative flex items-center gap-2 p-3 py-4 border-b border-custom-border-200">
      <Loader.Item width={`${250 + 10 * Math.floor(Math.random() * 10)}px`} height="22px" />
      <div className="ml-auto relative flex items-center gap-2">
        <Loader.Item width="60px" height="22px" />
        <Loader.Item width="22px" height="22px" />
        <Loader.Item width="22px" height="22px" />
        <Loader.Item width="22px" height="22px" />
      </div>
    </Loader>
  );
}
