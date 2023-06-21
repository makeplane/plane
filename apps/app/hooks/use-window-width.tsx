import { useEffect, useState } from "react";

export default function useWindowWidth() {
  const [windowWidth, setWindowWidth] = useState<number>(0);

  function handleWidthChange() {
    setWindowWidth(window.innerWidth);
  }

  useEffect(() => {
    window.addEventListener("resize", handleWidthChange);

    handleWidthChange();

    return () => window.removeEventListener("resize", handleWidthChange);
  }, []);

  return {
    windowWidth,
  };
}
