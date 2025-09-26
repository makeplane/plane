import { useCallback, useEffect, useId } from "react";
import { debounce } from "lodash-es";
// plane imports
import { Input } from "@plane/ui";
// local components
import { WidgetPropertyWrapper } from "../../property-wrapper";

type Props = {
  onChange: (val: string) => void;
  title: string;
  value: string | undefined;
};

export const WidgetColorPicker: React.FC<Props> = (props) => {
  const { onChange, title, value } = props;
  // unique id
  const id = useId();

  const debouncedColorUpdate = useCallback(
    debounce((color: string) => {
      onChange(color);
    }, 500),
    [onChange]
  );

  useEffect(
    () => () => {
      debouncedColorUpdate.cancel();
    },
    [debouncedColorUpdate]
  );

  return (
    <WidgetPropertyWrapper
      title={title}
      input={
        <label
          htmlFor={id}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-custom-background-80 cursor-pointer transition-colors"
        >
          <Input
            id={id}
            type="color"
            value={value}
            onChange={(e) => debouncedColorUpdate(e.target.value)}
            className="custom-color-picker flex-shrink-0 size-4 rounded-sm p-0"
          />
          <p className="flex-shrink-0 text-sm">{value?.toUpperCase()}</p>
        </label>
      }
    />
  );
};
