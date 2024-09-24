import { Combobox } from "@headlessui/react";
import React, {
  ElementType,
  Fragment,
  KeyboardEventHandler,
  ReactNode,
  Ref,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";

type Props = {
  as?: ElementType | undefined;
  ref?: Ref<HTMLElement> | undefined;
  tabIndex?: number | undefined;
  className?: string | undefined;
  value?: string | string[] | null;
  onChange?: (value: any) => void;
  disabled?: boolean | undefined;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement> | undefined;
  multiple?: boolean;
  renderByDefault?: boolean;
  button: ReactNode;
  children: ReactNode;
};

const ComboDropDown = forwardRef((props: Props, ref) => {
  const { button, renderByDefault = true, children, ...rest } = props;

  const dropDownButtonRef = useRef<HTMLDivElement | null>(null);

  const [shouldRender, setShouldRender] = useState(renderByDefault);

  const onHover = () => {
    setShouldRender(true);
  };

  useEffect(() => {
    const element = dropDownButtonRef.current as any;

    if (!element) return;

    element.addEventListener("mouseenter", onHover);

    return () => {
      element?.removeEventListener("mouseenter", onHover);
    };
  }, [dropDownButtonRef, shouldRender]);

  if (!shouldRender) {
    return (
      <div ref={dropDownButtonRef} className="h-full flex items-center">
        {button}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    <Combobox {...rest} ref={ref}>
      <Combobox.Button as={Fragment}>{button}</Combobox.Button>
      {children}
    </Combobox>
  );
});

const ComboOptions = Combobox.Options;
const ComboOption = Combobox.Option;
const ComboInput = Combobox.Input;

ComboDropDown.displayName = "ComboDropDown";

export { ComboDropDown, ComboOptions, ComboOption, ComboInput };
