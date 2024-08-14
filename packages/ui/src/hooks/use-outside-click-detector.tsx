import React, { useEffect } from "react";

// TODO: move it to helpers package
const useOutsideClickDetector = (ref: React.RefObject<HTMLElement>, callback: () => void) => {
  const handleClick = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      // get all the element with attribute name data-prevent-outside-click
      const preventOutsideClickElements = document.querySelectorAll("[data-prevent-outside-click]");
      // check if the click target is any of the elements with attribute name data-prevent-outside-click
      for (let i = 0; i < preventOutsideClickElements.length; i++) {
        if (preventOutsideClickElements[i].contains(event.target as Node)) {
          // if the click target is any of the elements with attribute name data-prevent-outside-click, return
          return;
        }
      }
      // get all the element with attribute name data-delay-outside-click
      const delayOutsideClickElements = document.querySelectorAll("[data-delay-outside-click]");
      // check if the click target is any of the elements with attribute name data-delay-outside-click
      for (let i = 0; i < delayOutsideClickElements.length; i++) {
        if (delayOutsideClickElements[i].contains(event.target as Node)) {
          // if the click target is any of the elements with attribute name data-delay-outside-click, delay the callback
          setTimeout(() => {
            callback();
          }, 1);
          return;
        }
      }
      // else, call the callback immediately
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  });
};

export default useOutsideClickDetector;
