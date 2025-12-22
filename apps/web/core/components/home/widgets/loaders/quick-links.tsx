import { range } from "lodash-es";
// ui
import { Loader } from "@plane/ui";

export function QuickLinksWidgetLoader() {
  return (
    <Loader className="bg-surface-1 rounded-xl gap-2 flex flex-wrap">
      {range(4).map((index) => (
        <Loader.Item key={index} height="56px" width="230px" />
      ))}
    </Loader>
  );
}
