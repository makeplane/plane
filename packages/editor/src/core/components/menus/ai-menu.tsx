import { useCallback, useEffect, useRef, useState } from "react";
import tippy from "tippy.js";
import type { Instance } from "tippy.js";
// plane utils
import { cn } from "@plane/utils";
// types
import type { TAIHandler } from "@/types";

type Props = {
  menu: TAIHandler["menu"];
};

export function AIFeaturesMenu(props: Props) {
  const { menu } = props;
  // states
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  // refs
  const menuRef = useRef<HTMLDivElement>(null);
  const popup = useRef<Instance | null>(null);

  useEffect(() => {
    if (!menuRef.current) return;

    menuRef.current.remove();
    menuRef.current.style.visibility = "visible";

    // @ts-expect-error - Tippy types are incorrect
    popup.current = tippy(document.body, {
      getReferenceClientRect: null,
      content: menuRef.current,
      appendTo: () => document.querySelector(".frame-renderer"),
      trigger: "manual",
      interactive: true,
      arrow: false,
      placement: "bottom-start",
      animation: "shift-away",
      hideOnClick: true,
      onShown: () => menuRef.current?.focus(),
    });

    return () => {
      popup.current?.destroy();
      popup.current = null;
    };
  }, []);

  const hidePopup = useCallback(() => {
    popup.current?.hide();
    setIsPopupVisible(false);
  }, []);

  useEffect(() => {
    const handleClickAIHandle = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches("#ai-handle") || menuRef.current?.contains(e.target as Node)) {
        e.preventDefault();

        if (!isPopupVisible) {
          popup.current?.setProps({
            getReferenceClientRect: () => target.getBoundingClientRect(),
          });
          popup.current?.show();
          setIsPopupVisible(true);
        }
        return;
      }

      hidePopup();
      return;
    };

    document.addEventListener("click", handleClickAIHandle);
    document.addEventListener("contextmenu", handleClickAIHandle);
    document.addEventListener("keydown", hidePopup);

    return () => {
      document.removeEventListener("click", handleClickAIHandle);
      document.removeEventListener("contextmenu", handleClickAIHandle);
      document.removeEventListener("keydown", hidePopup);
    };
  }, [hidePopup, isPopupVisible]);

  return (
    <div
      className={cn("opacity-0 pointer-events-none fixed inset-0 size-full z-10 transition-opacity", {
        "opacity-100 pointer-events-auto": isPopupVisible,
      })}
    >
      <div ref={menuRef} className="z-10">
        {menu?.({
          isOpen: isPopupVisible,
          onClose: hidePopup,
        })}
      </div>
    </div>
  );
}
